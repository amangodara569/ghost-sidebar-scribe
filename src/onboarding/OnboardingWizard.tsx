
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Music, Palette, BarChart3, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ onNext: () => void; onBack: () => void; data: any; setData: (data: any) => void }>;
}

interface OnboardingData {
  spotifyEnabled: boolean;
  theme: 'dark' | 'light' | 'auto';
  analyticsEnabled: boolean;
  pomodoroMinutes: number;
  completed: boolean;
}

const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useLocalStorage<OnboardingData>('vibemind-onboarding', {
    spotifyEnabled: false,
    theme: 'dark',
    analyticsEnabled: true,
    pomodoroMinutes: 25,
    completed: false
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to VibeMind',
      description: 'Your AI-powered productivity companion',
      icon: <div className="text-4xl">🧠</div>,
      component: WelcomeStep
    },
    {
      id: 'spotify',
      title: 'Connect Spotify',
      description: 'Enhance your focus with personalized music',
      icon: <Music className="w-8 h-8" />,
      component: SpotifyStep
    },
    {
      id: 'theme',
      title: 'Choose Your Theme',
      description: 'Customize your workspace appearance',
      icon: <Palette className="w-8 h-8" />,
      component: ThemeStep
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      description: 'Track your productivity patterns',
      icon: <BarChart3 className="w-8 h-8" />,
      component: AnalyticsStep
    },
    {
      id: 'timer',
      title: 'Focus Timer',
      description: 'Set your preferred work session duration',
      icon: <Timer className="w-8 h-8" />,
      component: TimerStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      setOnboardingData({ ...onboardingData, completed: true });
      toast.success('Welcome to VibeMind! You\'re all set to boost your productivity.');
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData({ ...onboardingData, ...updates });
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-overlay border-gray-600/30">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {currentStepData.icon}
          </div>
          <CardTitle className="text-2xl text-white">{currentStepData.title}</CardTitle>
          <p className="text-gray-300">{currentStepData.description}</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepComponent
                onNext={handleNext}
                onBack={handleBack}
                data={onboardingData}
                setData={updateData}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setOnboardingData({ ...onboardingData, completed: true });
                onComplete();
              }}
              className="text-gray-400 hover:text-gray-200"
            >
              Skip setup for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual step components
const WelcomeStep: React.FC<any> = () => (
  <div className="text-center py-8">
    <h3 className="text-xl font-semibold mb-4 text-white">
      Let's get you started with VibeMind
    </h3>
    <p className="text-gray-300 leading-relaxed">
      In the next few steps, we'll help you customize VibeMind to match your workflow. 
      This will only take a minute, and you can always change these settings later.
    </p>
    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <p className="text-blue-300 text-sm">
        💡 Tip: VibeMind works best when tailored to your specific productivity style
      </p>
    </div>
  </div>
);

const SpotifyStep: React.FC<any> = ({ data, setData }) => (
  <div className="py-8">
    <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
      <div>
        <h4 className="font-semibold text-white">Enable Spotify Integration</h4>
        <p className="text-sm text-gray-300">
          Connect your Spotify account to get music recommendations based on your focus patterns
        </p>
      </div>
      <Switch
        checked={data.spotifyEnabled}
        onCheckedChange={(checked) => setData({ spotifyEnabled: checked })}
      />
    </div>
    
    {data.spotifyEnabled && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-4 p-4 bg-gray-800/50 rounded-lg"
      >
        <p className="text-sm text-gray-300 mb-3">
          Click below to connect your Spotify account:
        </p>
        <Button className="w-full bg-green-500 hover:bg-green-600">
          Connect to Spotify
        </Button>
      </motion.div>
    )}
  </div>
);

const ThemeStep: React.FC<any> = ({ data, setData }) => {
  const themes = [
    { id: 'dark', name: 'Dark', description: 'Perfect for night owls' },
    { id: 'light', name: 'Light', description: 'Clean and bright' },
    { id: 'auto', name: 'Auto', description: 'Follows system preference' }
  ];

  return (
    <div className="py-8">
      <div className="grid gap-3">
        {themes.map((theme) => (
          <div
            key={theme.id}
            onClick={() => setData({ theme: theme.id as any })}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              data.theme === theme.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">{theme.name}</h4>
                <p className="text-sm text-gray-300">{theme.description}</p>
              </div>
              {data.theme === theme.id && (
                <Check className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsStep: React.FC<any> = ({ data, setData }) => (
  <div className="py-8">
    <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div>
        <h4 className="font-semibold text-white">Enable Analytics</h4>
        <p className="text-sm text-gray-300">
          Track your productivity patterns to get personalized insights
        </p>
      </div>
      <Switch
        checked={data.analyticsEnabled}
        onCheckedChange={(checked) => setData({ analyticsEnabled: checked })}
      />
    </div>
    
    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
      <h5 className="font-medium text-white mb-2">What we track:</h5>
      <ul className="text-sm text-gray-300 space-y-1">
        <li>• Focus session duration and frequency</li>
        <li>• Most productive times of day</li>
        <li>• Widget usage patterns</li>
        <li>• Goal completion rates</li>
      </ul>
      <p className="text-xs text-gray-400 mt-3">
        All data stays on your device and is never shared
      </p>
    </div>
  </div>
);

const TimerStep: React.FC<any> = ({ data, setData }) => {
  const durations = [15, 25, 30, 45, 60];

  return (
    <div className="py-8">
      <h4 className="font-semibold text-white mb-4">Default Focus Session Duration</h4>
      <div className="grid grid-cols-5 gap-2">
        {durations.map((duration) => (
          <button
            key={duration}
            onClick={() => setData({ pomodoroMinutes: duration })}
            className={`p-3 border rounded-lg text-center transition-colors ${
              data.pomodoroMinutes === duration
                ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                : 'border-gray-600 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="font-semibold">{duration}</div>
            <div className="text-xs">min</div>
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-sm text-gray-300">
          You've selected <span className="font-semibold text-white">{data.pomodoroMinutes} minutes</span> as your default focus session length. 
          This is based on the Pomodoro Technique, which suggests working in focused intervals followed by short breaks.
        </p>
      </div>
    </div>
  );
};

export default OnboardingWizard;
