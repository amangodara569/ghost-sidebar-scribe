
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
}

export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useLocalStorage<OnboardingState>('vibemind-onboarding-state', {
    completed: false,
    currentStep: 0,
    skipped: false
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding if not completed and not skipped
    if (!onboardingState.completed && !onboardingState.skipped) {
      setShowOnboarding(true);
    }
  }, [onboardingState]);

  const completeOnboarding = () => {
    setOnboardingState({
      ...onboardingState,
      completed: true
    });
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    setOnboardingState({
      ...onboardingState,
      skipped: true
    });
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    setOnboardingState({
      completed: false,
      currentStep: 0,
      skipped: false
    });
    setShowOnboarding(true);
  };

  const updateStep = (step: number) => {
    setOnboardingState({
      ...onboardingState,
      currentStep: step
    });
  };

  return {
    showOnboarding,
    onboardingState,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    updateStep
  };
};
