/**
 * Enrollment Guide Component
 *
 * Step-by-step guide for hardware key enrollment.
 */

import { useState } from 'react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface EnrollmentGuideProps {
  onComplete?: () => void;
  className?: string;
}

interface GuideStep {
  title: string;
  description: string;
  image?: string;
  tip?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Get a Security Key',
    description:
      'You will need a FIDO2/WebAuthn compatible security key. Popular options include YubiKey, Google Titan, or Feitian keys.',
    tip: 'Make sure your key supports FIDO2. Older U2F-only keys may have limited functionality.',
  },
  {
    title: 'Insert Your Key',
    description:
      'Plug your USB security key into an available USB port. For NFC keys, have them ready to tap.',
    tip: 'If using a USB-C key, make sure your computer has a USB-C port or use an adapter.',
  },
  {
    title: 'Register the Key',
    description:
      'Click "Register" and follow the prompts. You will be asked to touch your security key to confirm.',
    tip: 'The LED on your key may blink when it needs to be touched.',
  },
  {
    title: 'Name Your Key',
    description:
      'Give your key a memorable name like "Work YubiKey" or "Backup Key" so you can identify it later.',
    tip: 'Use descriptive names if you have multiple keys.',
  },
  {
    title: 'Add a Backup Key',
    description:
      'For security, we strongly recommend adding at least one backup key in case your primary key is lost.',
    tip: 'Store your backup key in a secure location separate from your primary key.',
  },
];

export function EnrollmentGuide({ onComplete, className }: EnrollmentGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  const step = GUIDE_STEPS[currentStep];

  // Guard against invalid step
  if (!step) {
    return null;
  }

  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      {/* Progress */}
      <div className="flex items-center justify-center mb-8">
        {GUIDE_STEPS.map((_, idx) => (
          <div key={idx} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                idx === currentStep
                  ? 'bg-primary-500 text-white'
                  : completedSteps.has(idx)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              )}
            >
              {completedSteps.has(idx) ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            {idx < GUIDE_STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1',
                  completedSteps.has(idx)
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{step.description}</p>

        {step.tip && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-left">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-500 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-amber-700 dark:text-amber-300 text-sm">{step.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Illustrations based on step */}
      <div className="flex justify-center mb-8">
        {currentStep === 0 && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl">Y</span>
              </div>
              <span className="text-xs text-gray-500">YubiKey</span>
            </div>
            <div className="p-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl">G</span>
              </div>
              <span className="text-xs text-gray-500">Titan Key</span>
            </div>
            <div className="p-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-2">
                <span className="text-2xl">F</span>
              </div>
              <span className="text-xs text-gray-500">Feitian</span>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="w-40 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
        )}

        {currentStep === 2 && (
          <div className="w-40 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center animate-pulse">
            <svg
              className="w-16 h-16 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
              />
            </svg>
          </div>
        )}

        {currentStep === 3 && (
          <div className="w-64 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center px-4">
            <input
              type="text"
              placeholder="My YubiKey"
              className="flex-1 bg-transparent outline-none"
              disabled
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-gray-500"
        >
          Skip Guide
        </Button>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button variant="secondary" onClick={handlePrevious}>
              Back
            </Button>
          )}
          <Button variant="primary" onClick={handleNext}>
            {currentStep === GUIDE_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EnrollmentGuide;
