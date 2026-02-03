/**
 * Key Challenge Component
 *
 * Visual challenge prompt for hardware key authentication.
 */

import { useState, useEffect } from 'react';
import { cn } from '@utils/cn';

interface KeyChallengeProps {
  isActive: boolean;
  timeout?: number;
  onTimeout?: () => void;
  keyType?: 'usb' | 'nfc' | 'internal';
  className?: string;
}

export function KeyChallenge({
  isActive,
  timeout = 60,
  onTimeout,
  keyType = 'usb',
  className,
}: KeyChallengeProps) {
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [pulseActive, setPulseActive] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(timeout);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeout, onTimeout]);

  // Pulse animation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 500);
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive]);

  const getKeyVisual = () => {
    switch (keyType) {
      case 'usb':
        return (
          <div className="relative">
            {/* USB Key shape */}
            <div className="w-20 h-10 bg-gray-800 rounded-lg relative">
              {/* USB connector */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-6 bg-gray-700 rounded-l">
                <div className="absolute right-0 top-1 w-1 h-1 bg-gray-500 rounded-full" />
                <div className="absolute right-0 bottom-1 w-1 h-1 bg-gray-500 rounded-full" />
              </div>
              {/* Touch sensor */}
              <div
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-colors',
                  pulseActive
                    ? 'bg-green-400 shadow-lg shadow-green-400/50'
                    : 'bg-gray-600'
                )}
              />
              {/* LED */}
              <div
                className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full',
                  isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'
                )}
              />
            </div>
          </div>
        );

      case 'nfc':
        return (
          <div className="relative w-24 h-16">
            {/* Card shape */}
            <div className="absolute inset-0 bg-gray-800 rounded-lg" />
            {/* NFC symbol */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className={cn(
                  'w-8 h-8 transition-colors',
                  pulseActive ? 'text-blue-400' : 'text-gray-500'
                )}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4v2c-1.1 0-2 .9-2 2s.9 2 2 2v2c-2.21 0-4-1.79-4-4zm8 0c0 2.21-1.79 4-4 4v-2c1.1 0 2-.9 2-2s-.9-2-2-2V8c2.21 0 4 1.79 4 4z" />
              </svg>
            </div>
            {/* Tap waves */}
            {isActive && (
              <div className="absolute -inset-2">
                <div
                  className={cn(
                    'absolute inset-0 rounded-xl border-2 border-blue-400 opacity-0',
                    pulseActive && 'animate-ping'
                  )}
                />
              </div>
            )}
          </div>
        );

      case 'internal':
        return (
          <div className="relative w-16 h-16">
            {/* Fingerprint icon */}
            <div
              className={cn(
                'w-full h-full rounded-full flex items-center justify-center transition-colors',
                pulseActive
                  ? 'bg-purple-100 dark:bg-purple-900/50'
                  : 'bg-gray-100 dark:bg-gray-800'
              )}
            >
              <svg
                className={cn(
                  'w-10 h-10 transition-colors',
                  pulseActive ? 'text-purple-500' : 'text-gray-400'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 10a1 1 0 011 1c0 2.236-.46 4.368-1.29 6.304a1 1 0 01-1.838-.789A13.952 13.952 0 009 11a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        );
    }
  };

  const getInstructions = () => {
    switch (keyType) {
      case 'usb':
        return 'Touch the sensor on your security key';
      case 'nfc':
        return 'Tap your NFC key on the reader';
      case 'internal':
        return 'Use Touch ID or Windows Hello';
    }
  };

  if (!isActive) return null;

  return (
    <div className={cn('text-center space-y-4', className)}>
      {/* Key visual */}
      <div className="flex justify-center">{getKeyVisual()}</div>

      {/* Instructions */}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {getInstructions()}
      </p>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        <span>{timeLeft}s remaining</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-1000"
          style={{ width: `${(timeLeft / timeout) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default KeyChallenge;
