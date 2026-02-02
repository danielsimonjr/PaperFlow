/**
 * Install Prompt Component
 *
 * Prompts user to install update and restart app after download.
 * Checks for unsaved documents before allowing restart.
 */

import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useUpdateStore } from '@/stores/updateStore';
import { useDocumentStore } from '@/stores/documentStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className = '' }: InstallPromptProps): React.ReactElement | null {
  const { state, installAndRestart, installLater, hideProgressDialog, isProgressDialogVisible } =
    useUpdateStore();

  // Get document state to check for unsaved changes
  const hasDocument = useDocumentStore((s) => s.fileName !== null);
  const isModified = useDocumentStore((s) => s.isModified);
  const hasUnsavedChanges = hasDocument && isModified;

  // Only show when update is downloaded and progress dialog is visible
  if (state.status !== 'downloaded' || !isProgressDialogVisible) {
    return null;
  }

  const handleRestartNow = () => {
    // Note: In a real implementation, you would prompt to save documents first
    // For now, we just proceed with the restart
    installAndRestart();
  };

  const handleRestartLater = async () => {
    await installLater();
    hideProgressDialog();
  };

  return (
    <Dialog open={true} onOpenChange={hideProgressDialog}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-500" />
            Update Ready to Install
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Update info */}
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            PaperFlow <strong>{state.availableVersion}</strong> has been downloaded and is ready to
            install. The app will restart to apply the update.
          </p>

          {/* Unsaved changes warning */}
          {hasUnsavedChanges && (
            <div className="mb-4 flex items-start gap-2 rounded bg-amber-50 p-3 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <strong>You have unsaved changes.</strong>
                <p className="mt-1">
                  Please save your document before restarting, or choose "Install Later" to continue
                  working.
                </p>
              </div>
            </div>
          )}

          {/* What's new summary (if available) */}
          {state.releaseNotes && (
            <div className="mb-4 rounded border border-gray-200 p-3 dark:border-gray-700">
              <h4 className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                What's New
              </h4>
              <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                {/* Show first 150 characters of release notes */}
                {state.releaseNotes.slice(0, 150)}
                {state.releaseNotes.length > 150 && '...'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button onClick={handleRestartLater} variant="secondary" size="sm">
              Install Later
            </Button>
            <Button
              onClick={handleRestartNow}
              variant="primary"
              size="sm"
              disabled={hasUnsavedChanges}
              title={hasUnsavedChanges ? 'Save your document first' : undefined}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Restart Now
            </Button>
          </div>

          {/* Note about background install */}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            If you choose "Install Later", the update will be installed automatically when you quit
            the app.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InstallPrompt;
