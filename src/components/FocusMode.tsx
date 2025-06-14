
import React, { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Timer, Volume2, VolumeX, Brain, Zap, Shield } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSiteBlocker } from '@/hooks/useSiteBlocker';
import { toast } from 'sonner';
import SiteBlockerOverlay from './SiteBlockerOverlay';

interface FocusSession {
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  date: string;
}

interface FocusSettings {
  autoStartTimer: boolean;
  defaultTimerDuration: number;
  dimOpacity: number;
  ambientVolume: number;
  preferredAmbientType: 'rain' | 'forest' | 'ocean' | 'white-noise' | 'none';
}

const FocusMode: React.FC = () => {
  const [isActive, setIsActive] = useLocalStorage<boolean>('focus-mode-active', false);
  const [settings, setSettings] = useLocalStorage<FocusSettings>('focus-mode-settings', {
    autoStartTimer: true,
    defaultTimerDuration: 25,
    dimOpacity: 0.5,
    ambientVolume: 0.3,
    preferredAmbientType: 'rain'
  });
  const [focusSessions, setFocusSessions] = useLocalStorage<FocusSession[]>('focus-sessions', []);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Site blocker integration
  const siteBlocker = useSiteBlocker();

  // Ambient sound URLs (using royalty-free sounds)
  const ambientSounds = {
    rain: 'https://www.soundjay.com/misc/sounds/rain-01.wav',
    forest: 'https://www.soundjay.com/misc/sounds/forest-01.wav', 
    ocean: 'https://www.soundjay.com/misc/sounds/ocean-01.wav',
    'white-noise': 'https://www.soundjay.com/misc/sounds/white-noise-01.wav',
    none: ''
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Initialize audio element
  useEffect(() => {
    if (settings.preferredAmbientType !== 'none') {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = settings.ambientVolume;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [settings.preferredAmbientType, settings.ambientVolume]);

  // Check for blocked sites when focus mode changes
  useEffect(() => {
    siteBlocker.checkCurrentSite(isActive);
  }, [isActive, siteBlocker.settings.enableSiteBlocker]);

  // Check for blocked sites on URL changes
  useEffect(() => {
    const checkSiteBlocking = () => {
      siteBlocker.checkCurrentSite(isActive);
    };

    // Listen for navigation events
    window.addEventListener('popstate', checkSiteBlocking);
    
    // Check immediately
    checkSiteBlocking();

    return () => {
      window.removeEventListener('popstate', checkSiteBlocking);
    };
  }, [isActive, siteBlocker]);

  const toggleFocusMode = async () => {
    if (!isActive) {
      // Start focus mode
      startTimeRef.current = new Date();
      const newSession: FocusSession = {
        startTime: new Date().toISOString(),
        duration: 0,
        date: new Date().toLocaleDateString()
      };
      setCurrentSession(newSession);
      
      // Start ambient music if enabled
      if (settings.preferredAmbientType !== 'none' && audioRef.current) {
        try {
          audioRef.current.src = ambientSounds[settings.preferredAmbientType];
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Audio playback failed:', error);
          toast.error('Could not start ambient audio');
        }
      }
      
      // Auto-start timer if enabled
      if (settings.autoStartTimer) {
        window.dispatchEvent(new CustomEvent('focus:start-timer', { 
          detail: settings.defaultTimerDuration 
        }));
      }
      
      toast.success('Focus mode activated', {
        description: 'Press Ctrl+Shift+F to exit'
      });
      
      // Check for blocked sites immediately after activation
      setTimeout(() => siteBlocker.checkCurrentSite(true), 100);
      
    } else {
      // End focus mode
      if (currentSession && startTimeRef.current) {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 60000);
        
        const completedSession: FocusSession = {
          ...currentSession,
          endTime: endTime.toISOString(),
          duration
        };
        
        setFocusSessions(prev => [...prev, completedSession]);
      }
      
      // Stop ambient music
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      setCurrentSession(null);
      startTimeRef.current = null;
      
      toast.success('Focus session completed');
    }
    
    setIsActive(!isActive);
  };

  const toggleAmbientMusic = async () => {
    if (!audioRef.current || settings.preferredAmbientType === 'none') return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        toast.error('Could not play ambient audio');
      }
    }
  };

  const updateSettings = (key: keyof FocusSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Calculate total focus time today
  const todaysSessions = focusSessions.filter(
    session => session.date === new Date().toLocaleDateString()
  );
  const totalFocusTimeToday = todaysSessions.reduce(
    (total, session) => total + session.duration, 0
  );

  return (
    <>
      {/* Site Blocker Overlay */}
      {siteBlocker.isBlocked && isActive && (
        <SiteBlockerOverlay
          siteName={siteBlocker.blockedSiteName}
          onDisableFocusMode={() => {
            setIsActive(false);
            toast.success('Focus Mode disabled');
          }}
        />
      )}

      {/* Background Overlay */}
      {isActive && (
        <div 
          className="fixed inset-0 bg-black pointer-events-none z-40 transition-opacity duration-500"
          style={{ opacity: settings.dimOpacity }}
        />
      )}
      
      {/* Focus Mode Controls */}
      <Card className="w-full border-0 shadow-sm" style={{
        backgroundColor: 'var(--theme-surface)',
        borderColor: 'var(--theme-border)'
      }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2" style={{
            color: 'var(--theme-text)'
          }}>
            <Brain className="w-4 h-4" />
            Focus Mode
            {isActive && (
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-500">Active</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
              <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
                {isActive ? 'Active' : 'Activate'}
              </span>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={toggleFocusMode}
            />
          </div>

          {/* Site Blocker Status */}
          {isActive && siteBlocker.settings.enableSiteBlocker && (
            <div className="flex items-center justify-between p-2 rounded border" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)'
            }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-xs" style={{ color: 'var(--theme-text)' }}>
                  Site Blocker Active
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                {siteBlocker.settings.blockedSites.length} sites blocked
              </div>
            </div>
          )}

          {/* Focus Stats */}
          {totalFocusTimeToday > 0 && (
            <div className="text-xs p-2 rounded border" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-secondary)'
            }}>
              Today: {totalFocusTimeToday} min ({todaysSessions.length} sessions)
            </div>
          )}

          {/* Current Session Timer */}
          {isActive && currentSession && (
            <div className="text-center p-3 rounded border" style={{
              backgroundColor: 'var(--theme-accent)',
              borderColor: 'var(--theme-border)',
              color: 'white'
            }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Timer className="w-4 h-4" />
                <span className="text-sm font-medium">Focus Session Active</span>
              </div>
              <div className="text-xs opacity-80">
                Started at {new Date(currentSession.startTime).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Ambient Music Controls */}
          {isActive && settings.preferredAmbientType !== 'none' && (
            <div className="flex items-center justify-between p-2 rounded border" style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)'
            }}>
              <span className="text-xs" style={{ color: 'var(--theme-text)' }}>
                Ambient: {settings.preferredAmbientType}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleAmbientMusic}
                className="h-6 w-6 p-0"
              >
                {isPlaying ? (
                  <Volume2 className="w-3 h-3" />
                ) : (
                  <VolumeX className="w-3 h-3" />
                )}
              </Button>
            </div>
          )}

          {/* Quick Settings */}
          {!isActive && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--theme-text)' }}>
                  Timer Duration (min)
                </label>
                <Slider
                  value={[settings.defaultTimerDuration]}
                  onValueChange={([value]) => updateSettings('defaultTimerDuration', value)}
                  max={120}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="text-xs text-center mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                  {settings.defaultTimerDuration} minutes
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--theme-text)' }}>
                  Ambient Sound
                </label>
                <Select
                  value={settings.preferredAmbientType}
                  onValueChange={(value) => updateSettings('preferredAmbientType', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="rain">Rain</SelectItem>
                    <SelectItem value="forest">Forest</SelectItem>
                    <SelectItem value="ocean">Ocean</SelectItem>
                    <SelectItem value="white-noise">White Noise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--theme-text)' }}>
                  Screen Dim ({Math.round(settings.dimOpacity * 100)}%)
                </label>
                <Slider
                  value={[settings.dimOpacity]}
                  onValueChange={([value]) => updateSettings('dimOpacity', value)}
                  max={0.8}
                  min={0.2}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Shortcut Info */}
          <div className="text-xs text-center p-2 rounded" style={{
            backgroundColor: 'var(--theme-background)',
            color: 'var(--theme-text-secondary)'
          }}>
            Press <kbd className="px-1 py-0.5 bg-gray-600 rounded text-white">Ctrl+Shift+F</kbd> to toggle
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FocusMode;
