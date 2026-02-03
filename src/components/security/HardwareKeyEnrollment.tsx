/**
 * Hardware Key Enrollment Component
 *
 * User flow for enrolling hardware security keys with
 * step-by-step guidance.
 */

import { useState, useCallback } from 'react';
import { useSecurityStore } from '@stores/securityStore';
import { getWebAuthnClient } from '@lib/security/webauthnClient';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface HardwareKeyEnrollmentProps {
  userId: string;
  userName: string;
  displayName: string;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

type EnrollmentStep = 'intro' | 'naming' | 'insert' | 'touch' | 'success' | 'error';

export function HardwareKeyEnrollment({
  userId,
  userName,
  displayName,
  onComplete,
  onCancel,
  className,
}: HardwareKeyEnrollmentProps) {
  const addKey = useSecurityStore((state) => state.addKey);

  const [step, setStep] = useState<EnrollmentStep>('intro');
  const [keyName, setKeyName] = useState('');
  // Track processing state for potential UI feedback
  const [, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEnrollment = useCallback(async () => {
    if (!keyName.trim()) return;

    setStep('insert');
    setIsProcessing(true);
    setError(null);

    try {
      const client = getWebAuthnClient();

      // Small delay to show the insert step
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStep('touch');

      const credential = await client.registerKey(
        userId,
        userName,
        displayName,
        keyName.trim()
      );

      // Add to store
      addKey(credential);

      setStep('success');
    } catch (err) {
      console.error('Enrollment failed:', err);
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to enroll hardware key'
      );
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [keyName, userId, userName, displayName, addKey]);

  const renderStep = () => {
    switch (step) {
      case 'intro':
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
              <h2 className="text-xl font-semibold">Add Hardware Security Key</h2>
              <p className="text-gray-500 mt-2">
                Hardware security keys provide the strongest protection for your documents.
                You can use USB keys like YubiKey, or built-in authenticators like Touch ID
                or Windows Hello.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
              <h3 className="font-medium text-sm mb-2">Supported authenticators:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  USB Security Keys (YubiKey, Feitian, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Touch ID (macOS)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Windows Hello
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setStep('naming')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        );

      case 'naming':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Name Your Key</h2>
              <p className="text-gray-500 mt-2">
                Give this key a name so you can identify it later.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Key Name</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Work YubiKey, Home Computer"
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                This name is only visible to you
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep('intro')} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={startEnrollment}
                disabled={!keyName.trim()}
                className="flex-1"
              >
                Register Key
              </Button>
            </div>
          </div>
        );

      case 'insert':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-pulse">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Insert Your Security Key</h2>
              <p className="text-gray-500 mt-2">
                Please insert your USB security key or prepare your authenticator.
              </p>
            </div>
          </div>
        );

      case 'touch':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center animate-bounce">
              <svg
                className="w-10 h-10 text-blue-600"
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
                Touch the button or sensor on your security key to complete registration.
              </p>
            </div>

            <div className="text-sm text-gray-400">Waiting for interaction...</div>
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
              <h2 className="text-xl font-semibold">Key Registered!</h2>
              <p className="text-gray-500 mt-2">
                Your security key "{keyName}" has been successfully registered.
              </p>
            </div>

            <Button variant="primary" onClick={onComplete} className="w-full">
              Done
            </Button>
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
              <h2 className="text-xl font-semibold">Registration Failed</h2>
              <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setStep('naming')} className="flex-1">
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

export default HardwareKeyEnrollment;
