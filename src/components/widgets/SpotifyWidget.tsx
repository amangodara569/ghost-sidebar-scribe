
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Play, Pause, SkipBack, SkipForward, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { spotifyService, SpotifyTrack } from '@/services/SpotifyService';

interface SpotifyWidgetProps {
  widgetId: string;
}

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widgetId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [clientId, setClientId] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial authentication status
    setIsAuthenticated(spotifyService.isAuthenticated());
    setClientId(spotifyService.getClientId());

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'spotify_auth') {
      handleAuthCallback(code);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAuthenticated) {
      // Initial fetch
      fetchCurrentTrack();
      
      // Update every 10 seconds
      intervalId = setInterval(fetchCurrentTrack, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated]);

  const handleAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const success = await spotifyService.handleAuthCallback(code);
      if (success) {
        setIsAuthenticated(true);
        toast({
          title: "Spotify Connected",
          description: "Successfully connected to Spotify",
        });
        fetchCurrentTrack();
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Spotify. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to Spotify",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentTrack = async () => {
    try {
      const track = await spotifyService.getCurrentTrack();
      setCurrentTrack(track);
      if (track) {
        setImageLoaded(false); // Reset for new image
      }
    } catch (error) {
      console.error('Failed to fetch current track:', error);
      if (error instanceof Error && error.message.includes('Authentication')) {
        setIsAuthenticated(false);
        toast({
          title: "Spotify Disconnected",
          description: "Please reconnect to Spotify",
          variant: "destructive",
        });
      }
    }
  };

  const handleConnect = () => {
    if (!clientId.trim()) {
      toast({
        title: "Client ID Required",
        description: "Please enter your Spotify Client ID first",
        variant: "destructive",
      });
      return;
    }

    try {
      spotifyService.setClientId(clientId.trim());
      const authUrl = spotifyService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Connect error:', error);
      toast({
        title: "Connection Error",
        description: "Please check your Client ID and try again",
        variant: "destructive",
      });
    }
  };

  const handlePlay = async () => {
    try {
      await spotifyService.play();
      fetchCurrentTrack();
    } catch (error) {
      console.error('Play error:', error);
      toast({
        title: "Playback Error",
        description: "Make sure Spotify is open with an active device",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    try {
      await spotifyService.pause();
      fetchCurrentTrack();
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const handleNext = async () => {
    try {
      await spotifyService.next();
      // Wait a bit before fetching to ensure track has changed
      setTimeout(fetchCurrentTrack, 1000);
    } catch (error) {
      console.error('Next error:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      await spotifyService.previous();
      setTimeout(fetchCurrentTrack, 1000);
    } catch (error) {
      console.error('Previous error:', error);
    }
  };

  const handleLogout = () => {
    spotifyService.logout();
    setIsAuthenticated(false);
    setCurrentTrack(null);
    toast({
      title: "Spotify Disconnected",
      description: "Successfully disconnected from Spotify",
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <Card className="sidebar-widget">
        <CardHeader className="sidebar-widget-header">
          <CardTitle className="sidebar-widget-title">Spotify</CardTitle>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            size="sm"
            variant="ghost"
            className="sidebar-button h-6 w-6 p-0"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="sidebar-widget-content space-y-4">
          {showSettings && (
            <div className="space-y-3">
              <div>
                <label className="sidebar-text block mb-2">Spotify Client ID</label>
                <Input
                  placeholder="Enter your Spotify Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="sidebar-input"
                />
                <p className="sidebar-text-secondary mt-1 text-xs">
                  Get this from your{' '}
                  <a 
                    href="https://developer.spotify.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Spotify Developer Dashboard
                  </a>
                </p>
              </div>
            </div>
          )}
          
          <div className="text-center py-6">
            <div className="text-green-400 mb-4">
              <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.175.289-.562.38-.85.204-2.334-1.424-5.27-1.746-8.728-.954-.335.077-.67-.133-.746-.467-.077-.334.133-.67.467-.746 3.809-.871 7.077-.496 9.651 1.112.289.175.38.562.204.85zm1.212-2.696c-.221.36-.691.472-1.051.25-2.67-1.64-6.736-2.115-9.882-1.158-.426.13-.875-.107-1.005-.533-.13-.425.107-.874.533-1.004 3.598-1.095 8.093-.571 11.154 1.314.36.221.472.691.25 1.051zm.104-2.81C14.692 8.967 9.681 8.747 6.56 9.85c-.51.18-1.07-.087-1.25-.597-.18-.51.087-1.07.597-1.25 3.584-1.265 9.141-1.023 12.894 1.184.433.254.576.816.322 1.249-.254.433-.816.576-1.249.322z"/>
              </svg>
            </div>
            <h3 className="sidebar-text font-medium mb-2">Connect to Spotify</h3>
            <p className="sidebar-text-secondary mb-4">Control your Spotify playback</p>
            <Button 
              onClick={handleConnect} 
              disabled={isLoading || !clientId.trim()}
              className="sidebar-button bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? 'Connecting...' : 'Connect Spotify'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sidebar-widget">
      <CardHeader className="sidebar-widget-header">
        <CardTitle className="sidebar-widget-title">Spotify</CardTitle>
        <Button
          onClick={handleLogout}
          size="sm"
          variant="ghost"
          className="sidebar-button h-6 w-6 p-0"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="sidebar-widget-content space-y-4">
        {currentTrack ? (
          <>
            {/* Now Playing */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                  {currentTrack.albumArt && (
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.album}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageLoaded(false)}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="sidebar-text font-medium truncate">{currentTrack.name}</h3>
                <p className="sidebar-text-secondary text-sm truncate">{currentTrack.artist}</p>
                <p className="sidebar-text-secondary text-xs truncate">{currentTrack.album}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((currentTrack.progress / currentTrack.duration) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs sidebar-text-secondary">
                <span>{formatTime(currentTrack.progress)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-3">
              <Button
                onClick={handlePrevious}
                size="sm"
                variant="ghost"
                className="sidebar-button h-8 w-8 p-0"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={currentTrack.isPlaying ? handlePause : handlePlay}
                size="sm"
                className="sidebar-button bg-green-500 hover:bg-green-600 text-white h-9 w-9 p-0 rounded-full"
                title={currentTrack.isPlaying ? 'Pause' : 'Play'}
              >
                {currentTrack.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              
              <Button
                onClick={handleNext}
                size="sm"
                variant="ghost"
                className="sidebar-button h-8 w-8 p-0"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="sidebar-text-secondary">No track currently playing</p>
            <p className="sidebar-text-secondary text-sm mt-1">Start playing music in Spotify</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpotifyWidget;
