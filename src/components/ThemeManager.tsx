
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

interface ThemeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ isOpen, onClose }) => {
  const { 
    currentTheme, 
    customTheme, 
    isCustom, 
    presets, 
    setTheme, 
    setCustomTheme, 
    resetToDefault,
    isTransitioning 
  } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customColors, setCustomColors] = useState({
    background: '#111827',
    surface: '#1f2937',
    accent: '#6366f1',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    border: '#374151',
  });
  const [customOpacity, setCustomOpacity] = useState(0.9);

  const handlePresetSelect = (preset: any) => {
    setTheme(preset);
    toast.success(`Theme set to ${preset.emoji}${preset.displayName}${preset.emoji}`, {
      duration: 2000,
    });
  };

  const handleCustomThemeApply = () => {
    setCustomTheme({
      ...customColors,
      opacity: customOpacity,
    });
    toast.success('🎨 Custom theme applied!', {
      duration: 2000,
    });
  };

  const handleReset = () => {
    resetToDefault();
    toast.success('🌑 Theme reset to default', {
      duration: 2000,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
          style={{ backgroundColor: 'var(--theme-surface)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Palette className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
                Theme Manager
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'presets'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      currentTheme?.id === preset.id && !isCustom
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => handlePresetSelect(preset)}
                    style={{ 
                      backgroundColor: currentTheme?.id === preset.id && !isCustom 
                        ? 'var(--theme-accent)20' 
                        : 'var(--theme-surface)' 
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{preset.emoji}</span>
                      <h3 className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                        {preset.displayName}
                      </h3>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {Object.entries(preset.colors).slice(0, 4).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded-full border border-gray-600"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                      Opacity: {Math.round(preset.opacity * 100)}%
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Custom Tab */}
          {activeTab === 'custom' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(customColors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium capitalize" style={{ color: 'var(--theme-text)' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-12 h-10 rounded border border-gray-600"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  Opacity: {Math.round(customOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="1.0"
                  step="0.05"
                  value={customOpacity}
                  onChange={(e) => setCustomOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleCustomThemeApply}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Apply Custom Theme
              </button>
            </motion.div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Default
            </button>
            
            <div className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
              {isTransitioning && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Applying theme...
                </motion.span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThemeManager;
