/**
 * Scanner Selection Dialog
 *
 * Dialog for selecting scanner device with device info,
 * capabilities, and status display.
 */

import { useState, useEffect, useCallback } from 'react';
import { useScannerStore } from '@stores/scannerStore';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { ScannerDevice } from '@lib/scanner/types';

interface ScannerSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (device: ScannerDevice) => void;
}

export function ScannerSelectDialog({
  isOpen,
  onClose,
  onSelect,
}: ScannerSelectDialogProps) {
  const {
    devices,
    selectedDevice,
    isLoadingDevices,
    setDevices,
    selectDevice,
    setLoadingDevices,
  } = useScannerStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshDevices = useCallback(async () => {
    setIsRefreshing(true);
    setLoadingDevices(true);

    try {
      // In production, this would call the IPC
      // For now, use mock devices
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock devices
      const mockDevices: ScannerDevice[] = [
        {
          id: 'mock-scanner-1',
          name: 'PaperFlow Virtual Scanner',
          manufacturer: 'PaperFlow',
          model: 'Virtual Scanner Pro',
          platform: 'wia',
          available: true,
          capabilities: {
            resolutions: [75, 100, 150, 200, 300, 600],
            colorModes: ['color', 'grayscale', 'blackwhite'],
            duplex: true,
            hasADF: true,
            hasFlatbed: true,
            maxWidth: 8.5,
            maxHeight: 14,
            paperSizes: ['auto', 'letter', 'legal', 'a4'],
          },
        },
        {
          id: 'mock-scanner-2',
          name: 'Basic Flatbed Scanner',
          manufacturer: 'Generic',
          model: 'Flatbed 1000',
          platform: 'twain',
          available: true,
          capabilities: {
            resolutions: [75, 150, 300],
            colorModes: ['color', 'grayscale'],
            duplex: false,
            hasADF: false,
            hasFlatbed: true,
            maxWidth: 8.5,
            maxHeight: 11,
            paperSizes: ['auto', 'letter', 'a4'],
          },
        },
      ];

      setDevices(mockDevices);
    } catch (error) {
      console.error('Failed to refresh devices:', error);
    } finally {
      setIsRefreshing(false);
      setLoadingDevices(false);
    }
  }, [setDevices, setLoadingDevices]);

  // Refresh devices on open
  useEffect(() => {
    if (isOpen) {
      refreshDevices();
    }
  }, [isOpen, refreshDevices]);

  const handleSelect = (device: ScannerDevice) => {
    selectDevice(device);
    onSelect?.(device);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Select Scanner</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-96">
          {isLoadingDevices || isRefreshing ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-500">Searching for scanners...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">No scanners found</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure your scanner is connected and turned on
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleSelect(device)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-colors',
                    selectedDevice?.id === device.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Scanner icon */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{device.name}</span>
                        {device.available ? (
                          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                            Online
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                            Offline
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {device.manufacturer} {device.model}
                      </p>

                      {/* Capabilities */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {device.capabilities.hasFlatbed && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            Flatbed
                          </span>
                        )}
                        {device.capabilities.hasADF && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            ADF
                          </span>
                        )}
                        {device.capabilities.duplex && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            Duplex
                          </span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                          {Math.max(...device.capabilities.resolutions)} DPI
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshDevices}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ScannerSelectDialog;
