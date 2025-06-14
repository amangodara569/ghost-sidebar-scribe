
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface BlockedSite {
  id: string;
  url: string;
  name: string;
  isRegex: boolean;
}

interface SiteBlockerSettings {
  enableSiteBlocker: boolean;
  blockedSites: BlockedSite[];
}

export const useSiteBlocker = () => {
  const [settings, setSettings] = useLocalStorage<SiteBlockerSettings>('site-blocker-settings', {
    enableSiteBlocker: true,
    blockedSites: [
      { id: '1', url: '*.youtube.com', name: 'YouTube', isRegex: true },
      { id: '2', url: '*.twitter.com', name: 'Twitter', isRegex: true },
      { id: '3', url: '*.facebook.com', name: 'Facebook', isRegex: true },
      { id: '4', url: '*.instagram.com', name: 'Instagram', isRegex: true },
      { id: '5', url: '*.reddit.com', name: 'Reddit', isRegex: true },
    ]
  });

  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedSiteName, setBlockedSiteName] = useState('');

  const isUrlBlocked = (url: string, blockedSites: BlockedSite[]): { blocked: boolean; siteName: string } => {
    for (const site of blockedSites) {
      if (site.isRegex) {
        // Convert wildcard pattern to regex
        const regexPattern = site.url.replace(/\*/g, '.*').replace(/\./g, '\\.');
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(url)) {
          return { blocked: true, siteName: site.name };
        }
      } else {
        if (url.toLowerCase().includes(site.url.toLowerCase())) {
          return { blocked: true, siteName: site.name };
        }
      }
    }
    return { blocked: false, siteName: '' };
  };

  const checkCurrentSite = (focusModeActive: boolean) => {
    if (!settings.enableSiteBlocker || !focusModeActive) {
      setIsBlocked(false);
      return;
    }

    const currentUrl = window.location.hostname;
    const { blocked, siteName } = isUrlBlocked(currentUrl, settings.blockedSites);
    
    setIsBlocked(blocked);
    setBlockedSiteName(siteName);
  };

  const addBlockedSite = (url: string, name: string, isRegex: boolean = false) => {
    const newSite: BlockedSite = {
      id: Date.now().toString(),
      url,
      name,
      isRegex
    };
    
    setSettings(prev => ({
      ...prev,
      blockedSites: [...prev.blockedSites, newSite]
    }));
  };

  const removeBlockedSite = (id: string) => {
    setSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(site => site.id !== id)
    }));
  };

  const updateSettings = (newSettings: Partial<SiteBlockerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    isBlocked,
    blockedSiteName,
    checkCurrentSite,
    addBlockedSite,
    removeBlockedSite,
    updateSettings
  };
};
