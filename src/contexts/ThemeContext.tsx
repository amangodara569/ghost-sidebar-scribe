
import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemePreset {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  colors: {
    background: string;
    surface: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  opacity: number;
}

interface CustomTheme {
  background: string;
  surface: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  opacity: number;
}

interface ThemeContextType {
  currentTheme: ThemePreset | null;
  customTheme: CustomTheme | null;
  isCustom: boolean;
  presets: ThemePreset[];
  setTheme: (theme: ThemePreset) => void;
  setCustomTheme: (theme: CustomTheme) => void;
  resetToDefault: () => void;
  isTransitioning: boolean;
}

const defaultPresets: ThemePreset[] = [
  {
    id: 'dark-grey',
    name: 'dark-grey',
    displayName: 'Dark Grey',
    emoji: '🌑',
    colors: {
      background: 'rgb(17, 24, 39)', // gray-900
      surface: 'rgb(31, 41, 55)', // gray-800
      accent: 'rgb(99, 102, 241)', // indigo-500
      text: 'rgb(243, 244, 246)', // gray-100
      textSecondary: 'rgb(156, 163, 175)', // gray-400
      border: 'rgb(55, 65, 81)', // gray-700
    },
    opacity: 0.9,
  },
  {
    id: 'cyberpunk',
    name: 'cyberpunk',
    displayName: 'Cyberpunk Night',
    emoji: '⚡',
    colors: {
      background: 'rgb(13, 13, 23)',
      surface: 'rgb(25, 25, 45)',
      accent: 'rgb(147, 51, 234)', // purple-600
      text: 'rgb(34, 197, 94)', // green-500
      textSecondary: 'rgb(168, 85, 247)', // purple-400
      border: 'rgb(147, 51, 234)',
    },
    opacity: 0.95,
  },
  {
    id: 'monochrome',
    name: 'monochrome',
    displayName: 'Monochrome',
    emoji: '⚫',
    colors: {
      background: 'rgb(0, 0, 0)',
      surface: 'rgb(38, 38, 38)',
      accent: 'rgb(255, 255, 255)',
      text: 'rgb(255, 255, 255)',
      textSecondary: 'rgb(163, 163, 163)',
      border: 'rgb(82, 82, 82)',
    },
    opacity: 1.0,
  },
  {
    id: 'earthy',
    name: 'earthy',
    displayName: 'Earthy Tones',
    emoji: '🌿',
    colors: {
      background: 'rgb(41, 37, 36)', // stone-800
      surface: 'rgb(68, 64, 60)', // stone-700
      accent: 'rgb(34, 197, 94)', // green-500
      text: 'rgb(250, 250, 249)', // stone-50
      textSecondary: 'rgb(168, 162, 158)', // stone-400
      border: 'rgb(87, 83, 78)', // stone-600
    },
    opacity: 0.85,
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset | null>(defaultPresets[0]);
  const [customTheme, setCustomThemeState] = useState<CustomTheme | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Load theme from storage
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme to CSS variables
    applyTheme();
  }, [currentTheme, customTheme, isCustom]);

  const loadTheme = async () => {
    try {
      if (window.electronAPI) {
        const savedTheme = await window.electronAPI.invoke('theme:get');
        if (savedTheme) {
          if (savedTheme.isCustom) {
            setCustomThemeState(savedTheme.customTheme);
            setIsCustom(true);
          } else {
            const preset = defaultPresets.find(p => p.id === savedTheme.presetId);
            if (preset) {
              setCurrentTheme(preset);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const applyTheme = () => {
    const theme = isCustom ? customTheme : currentTheme;
    if (!theme) return;

    const root = document.documentElement;
    const colors = 'colors' in theme ? theme.colors : theme;
    
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-opacity', (theme.opacity || 0.9).toString());
  };

  const setTheme = async (theme: ThemePreset) => {
    setIsTransitioning(true);
    setCurrentTheme(theme);
    setIsCustom(false);
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('theme:save', {
          presetId: theme.id,
          isCustom: false,
        });
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const setCustomTheme = async (theme: CustomTheme) => {
    setIsTransitioning(true);
    setCustomThemeState(theme);
    setIsCustom(true);
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('theme:save', {
          customTheme: theme,
          isCustom: true,
        });
      }
    } catch (error) {
      console.error('Failed to save custom theme:', error);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const resetToDefault = async () => {
    setIsTransitioning(true);
    setCurrentTheme(defaultPresets[0]);
    setIsCustom(false);
    setCustomThemeState(null);
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('theme:save', {
          presetId: defaultPresets[0].id,
          isCustom: false,
        });
      }
    } catch (error) {
      console.error('Failed to reset theme:', error);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      customTheme,
      isCustom,
      presets: defaultPresets,
      setTheme,
      setCustomTheme,
      resetToDefault,
      isTransitioning,
    }}>
      <motion.div 
        className="min-h-screen transition-colors duration-300"
        style={{
          backgroundColor: `var(--theme-background)`,
          color: `var(--theme-text)`,
        }}
        animate={isTransitioning ? { scale: [1, 1.01, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
