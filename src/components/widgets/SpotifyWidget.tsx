
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
}

interface SpotifyWidgetProps {
  widgetId: string;
}

const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ widgetId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [volume, setVolume] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial connection status
    checkSpotifyConnection();

    // Listen for track updates
    if (window.electronAPI) {
      const handleTrackUpdate = (track: SpotifyTrack) => {
        setCurrentTrack(track);
        setImageLoaded(false); // Reset for new image
      };

      const handleConnectionStatus = (status: boolean) => {
        setIsConnected(status);
        if (!status) {
          setCurrentTrack(null);
          toast({
            title: "Spotify Disconnected",
            description: "Please reconnect to Spotify to continue playback",
          });
        }
      };

      window.electronAPI.on('spotify:trackUpdate', handleTrackUpdate);
      window.electronAPI.on('spotify:connectionStatus', handleConnectionStatus);

      return () => {
        window.electronAPI.removeListener('spotify:trackUpdate', handleTrackUpdate);
        window.electronAPI.removeListener('spotify:connectionStatus', handleConnectionStatus);
      };
    }
  }, []);

  const checkSpotifyConnection = async () => {
    try {
      if (window.electronAPI) {
        const connected = await window.electronAPI.invoke('spotify:checkConnection');
        setIsConnected(connected);
        if (connected) {
          // Get current track
          const track = await window.electronAPI.invoke('spotify:getCurrentTrack');
          setCurrentTrack(track);
        }
      }
    } catch (error) {
      console.error('Failed to check Spotify connection:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.invoke('spotify:connect');
        if (success) {
          setIsConnected(true);
          toast({
            title: "Spotify Connected",
            description: "Successfully connected to Spotify",
          });
          checkSpotifyConnection();
        } else {
          toast({
            title: "Connection Failed",
            description: "Failed to connect to Spotify. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Failed to connect to Spotify:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting to Spotify",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('spotify:play');
      }
    } catch (error) {
      console.error('Failed to play:', error);
      toast({
        title: "Playback Error",
        description: "Failed to start playback",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('spotify:pause');
      }
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleNext = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('spotify:next');
      }
    } catch (error) {
      console.error('Failed to skip to next track:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('spotify:prev');
      }
    } catch (error) {
      console.error('Failed to skip to previous track:', error);
    }
  };

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('spotify:setVolume', newVolume);
      }
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <Card className="bg-transparent border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-100">Spotify</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <div className="text-green-400 mb-4">
              <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.175.289-.562.38-.85.204-2.334-1.424-5.27-1.746-8.728-.954-.335.077-.67-.133-.746-.467-.077-.334.133-.67.467-.746 3.809-.871 7.077-.496 9.651 1.112.289.175.38.562.204.85zm1.212-2.696c-.221.36-.691.472-1.051.25-2.67-1.64-6.736-2.115-9.882-1.158-.426.13-.875-.107-1.005-.533-.13-.425.107-.874.533-1.004 3.598-1.095 8.093-.571 11.154 1.314.36.221.472.691.25 1.051zm.104-2.81C14.692 8.967 9.681 8.747 6.56 9.85c-.51.18-1.07-.087-1.25-.597-.18-.51.087-1.07.597-1.25 3.584-1.265 9.141-1.023 12.894 1.184.433.254.576.816.322 1.249-.254.433-.816.576-1.249.322z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-100 mb-2">Connect to Spotify</h3>
            <p className="text-gray-400 mb-4">Connect your Spotify account to control playback</p>
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isLoading ? 'Connecting...' : 'Connect Spotify'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-100">Spotify</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTrack ? (
          <>
            {/* Now Playing */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={currentTrack.albumArt}
                    alt={currentTrack.album}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{currentTrack.name}</h3>
                <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
                <p className="text-gray-500 text-xs truncate">{currentTrack.album}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(currentTrack.progress / currentTrack.duration) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTrack.progress)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={handlePrevious}
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={currentTrack.isPlaying ? handlePause : handlePlay}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 rounded-full"
              >
                {currentTrack.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                onClick={handleNext}
                size="sm"
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-8">{volume}%</span>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No track currently playing</p>
            <p className="text-gray-500 text-sm mt-1">Start playing music in Spotify</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpotifyWidget;
