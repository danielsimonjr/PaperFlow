/**
 * Hardware Key Authentication Component
 *
 * Authentication UI for hardware key challenges.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSecurityStore } from '@stores/securityStore';
import { getWebAuthnClient } from '@lib/security/webauthnClient';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface HardwareKeyAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  timeout?: number;
  allowFallback?: boolean;
  className?: string;
}

type AuthStep = 'prompt' | 'waiting' | 'success' | 'error' | 'timeout';

export function HardwareKeyAuth({
  onSuccess,
  onCancel,
  timeout = 60000,
  allowFallback = true,
  className,
}: HardwareKeyAuthProps) {
  const { authenticate, getKeys } = useSecurityStore();
  const keys = getKeys();

  const [step, setStep] = useState<AuthStep>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeout / 1000);
  // Track processing state for potential UI feedback
  const [, setIsProcessing] = useState(false);

  // Start authentication
  const startAuth = useCallback(async () => {
    if (keys.length === 0) {
      setError('No security keys enrolled');
      setStep('error');
      return;
    }

    setStep('waiting');
    setIsProcessing(true);
    setError(null);
    setTimeLeft(timeout / 1000);

    try {
      const client = getWebAuthnClient();
      const result = await client.authenticate();

      authenticate(result.credentialId);
      setStep('success');

      // Delay before completing
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (err) {
      console.error('Authentication failed:', err);

      if (err && typeof err === 'object' && 'code' in err) {
        const webauthnErr = err as { code: string; message: string };
        if (webauthnErr.code === 'TIMEOUT') {
          setStep('timeout');
        } else {
          setError(webauthnErr.message);
          setStep('error');
        }
      } else {
        setError('Authentication failed');
        setStep('error');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [keys, timeout, authenticate, onSuccess]);

  // Countdown timer
  useEffect(() => {
    if (step !== 'waiting') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Auto-start on mount if only one key
  useEffect(() => {
    if (keys.length === 1 && step === 'prompt') {
      startAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run only on mount
  }, []);

  const renderStep = () => {
    switch (step) {
      case 'prompt':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary-500"
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

            <div>
              <h2 className="text-xl font-semibold">Authentication Required</h2>
              <p className="text-gray-500 mt-2">
                Use your security key to verify your identity.
              </p>
            </div>

            {/* List enrolled keys */}
            {keys.length > 1 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-2">Available keys:</p>
                <div className="space-y-1">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {key.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {allowFallback && (
                <Button variant="secondary" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                onClick={startAuth}
                className="flex-1"
              >
                Use Security Key
              </Button>
            </div>
          </div>
        );

      case 'waiting':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-500 animate-pulse"
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

            <div>
              <h2 className="text-xl font-semibold">Touch Your Security Key</h2>
              <p className="text-gray-500 mt-2">
                Touch the button or sensor on your security key.
              </p>
            </div>

            {/* Countdown */}
            <div className="relative w-16 h-16 mx-auto">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={175.9}
                  strokeDashoffset={175.9 * (1 - timeLeft / (timeout / 1000))}
                  className="text-blue-500 transition-all duration-1000"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-medium">
                {timeLeft}
              </span>
            </div>

            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Authenticated!</h2>
              <p className="text-gray-500 mt-2">
                Your identity has been verified.
              </p>
            </div>
          </div>
        );

      case 'timeout':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Timed Out</h2>
              <p className="text-gray-500 mt-2">
                The authentication request timed out. Please try again.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={startAuth} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Authentication Failed</h2>
              <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setStep('prompt')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn('max-w-md mx-auto p-6', className)}>{renderStep()}</div>
  );
}

export default HardwareKeyAuth;
