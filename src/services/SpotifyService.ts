
interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
}

interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  volume_percent: number;
}

interface SpotifyAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

class SpotifyService {
  private clientId = '';
  private redirectUri = window.location.origin;
  private scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming'
  ];

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  setClientId(clientId: string) {
    if (!clientId || clientId.trim() === '') {
      throw new Error('Client ID cannot be empty');
    }
    this.clientId = clientId.trim();
    localStorage.setItem('spotify_client_id', this.clientId);
  }

  getClientId(): string {
    return this.clientId || localStorage.getItem('spotify_client_id') || '';
  }

  private loadTokensFromStorage() {
    try {
      this.accessToken = localStorage.getItem('spotify_access_token');
      this.refreshToken = localStorage.getItem('spotify_refresh_token');
      const expiry = localStorage.getItem('spotify_token_expiry');
      this.tokenExpiry = expiry ? parseInt(expiry) : null;
      
      // Load client ID
      this.clientId = localStorage.getItem('spotify_client_id') || '';
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  private saveTokensToStorage() {
    try {
      if (this.accessToken) {
        localStorage.setItem('spotify_access_token', this.accessToken);
      }
      if (this.refreshToken) {
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
      }
      if (this.tokenExpiry) {
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
      }
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  getAuthUrl(): string {
    if (!this.clientId) {
      throw new Error('Spotify Client ID not set');
    }
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: 'spotify_auth'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleAuthCallback(code: string): Promise<boolean> {
    if (!code) {
      console.error('No authorization code provided');
      return false;
    }

    if (!this.clientId) {
      console.error('Client ID not set');
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Auth callback failed:', errorData);
        return false;
      }

      const data = await response.json();
      
      if (!data.access_token) {
        console.error('No access token in response');
        return false;
      }

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      this.saveTokensToStorage();
      return true;
    } catch (error) {
      console.error('Auth callback error:', error);
      return false;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || !this.clientId) {
      console.error('Cannot refresh token: missing refresh token or client ID');
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
        }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      
      if (!data.access_token) {
        console.error('No access token in refresh response');
        return false;
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      
      this.saveTokensToStorage();
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      return false;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    if (this.isAuthenticated()) return true;
    
    if (this.refreshToken) {
      return await this.refreshAccessToken();
    }
    
    return false;
  }

  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!(await this.ensureValidToken())) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Token expired, try refresh once
        if (await this.refreshAccessToken()) {
          return this.makeApiCall(endpoint, options);
        }
        throw new Error('Authentication expired');
      }

      if (response.status === 204) {
        // No content response (common for control endpoints)
        return null;
      }

      if (response.status === 404) {
        throw new Error('No active device found. Please open Spotify and start playing music.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  }

  async getDevices(): Promise<SpotifyDevice[]> {
    try {
      const data = await this.makeApiCall('/me/player/devices');
      return data?.devices || [];
    } catch (error) {
      console.error('Get devices error:', error);
      return [];
    }
  }

  async getCurrentTrack(): Promise<SpotifyTrack | null> {
    try {
      const data = await this.makeApiCall('/me/player/currently-playing');
      
      if (!data || !data.item) {
        return null;
      }

      return {
        name: data.item.name || 'Unknown Track',
        artist: data.item.artists?.[0]?.name || 'Unknown Artist',
        album: data.item.album?.name || 'Unknown Album',
        albumArt: data.item.album?.images?.[0]?.url || '',
        duration: data.item.duration_ms || 0,
        progress: data.progress_ms || 0,
        isPlaying: data.is_playing || false,
      };
    } catch (error) {
      console.error('Get current track error:', error);
      return null;
    }
  }

  async play(): Promise<void> {
    try {
      await this.makeApiCall('/me/player/play', { method: 'PUT' });
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      await this.makeApiCall('/me/player/pause', { method: 'PUT' });
    } catch (error) {
      console.error('Pause error:', error);
      throw error;
    }
  }

  async next(): Promise<void> {
    try {
      await this.makeApiCall('/me/player/next', { method: 'POST' });
    } catch (error) {
      console.error('Next track error:', error);
      throw error;
    }
  }

  async previous(): Promise<void> {
    try {
      await this.makeApiCall('/me/player/previous', { method: 'POST' });
    } catch (error) {
      console.error('Previous track error:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      await this.makeApiCall(`/me/player/volume?volume_percent=${clampedVolume}`, { 
        method: 'PUT' 
      });
    } catch (error) {
      console.error('Set volume error:', error);
      throw error;
    }
  }

  async seek(positionMs: number): Promise<void> {
    try {
      await this.makeApiCall(`/me/player/seek?position_ms=${positionMs}`, { 
        method: 'PUT' 
      });
    } catch (error) {
      console.error('Seek error:', error);
      throw error;
    }
  }

  async transferPlayback(deviceId: string): Promise<void> {
    try {
      await this.makeApiCall('/me/player', {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [deviceId],
          play: true
        })
      });
    } catch (error) {
      console.error('Transfer playback error:', error);
      throw error;
    }
  }

  logout() {
    this.clearTokens();
    this.clientId = '';
    localStorage.removeItem('spotify_client_id');
  }
}

export const spotifyService = new SpotifyService();
export type { SpotifyTrack, SpotifyDevice };
