
import { useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

export interface BlockedSite {
  id: string;
  name: string;
  url: string;
  isRegex: boolean;
  createdAt: number;
}

interface SiteBlockerSettings {
  enableSiteBlocker: boolean;
  blockedSites: BlockedSite[];
  showWarnings: boolean;
  redirectUrl: string;
}

const defaultSettings: SiteBlockerSettings = {
  enableSiteBlocker: false,
  blockedSites: [],
  showWarnings: true,
  redirectUrl: 'about:blank'
};

export const useSiteBlocker = () => {
  const [settings, setSettings] = useLocalStorage<SiteBlockerSettings>('site-blocker-settings', defaultSettings);

  const addBlockedSite = useCallback((url: string, name: string, isRegex: boolean = false) => {
    const newSite: BlockedSite = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim(),
      isRegex,
      createdAt: Date.now()
    };

    setSettings(prev => ({
      ...prev,
      blockedSites: [...prev.blockedSites, newSite]
    }));

    toast.success(`Added "${name}" to blocked sites`);
  }, [setSettings]);

  const removeBlockedSite = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(site => site.id !== id)
    }));

    toast.success('Removed blocked site');
  }, [setSettings]);

  const updateSettings = useCallback((newSettings: Partial<SiteBlockerSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, [setSettings]);

  const isBlocked = useCallback((url: string): boolean => {
    if (!settings.enableSiteBlocker) return false;

    return settings.blockedSites.some(site => {
      if (site.isRegex) {
        try {
          const pattern = site.url.replace(/\*/g, '.*');
          const regex = new RegExp(pattern, 'i');
          return regex.test(url);
        } catch {
          return false;
        }
      } else {
        return url.toLowerCase().includes(site.url.toLowerCase());
      }
    });
  }, [settings]);

  return {
    settings,
    addBlockedSite,
    removeBlockedSite,
    updateSettings,
    isBlocked
  };
};
