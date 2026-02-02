/**
 * Release Notes Component
 *
 * Displays release notes for available updates.
 * Renders markdown content properly.
 */

import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { useUpdateStore } from '@/stores/updateStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export interface ReleaseNotesProps {
  className?: string;
}

/**
 * Simple markdown parser for release notes
 * Handles basic formatting: headers, lists, bold, italic, links
 */
function parseMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 ml-4 list-disc space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 dark:text-gray-300">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    // Handle bold, italic, and links
    return text
      .split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
      .map((part, i) => {
        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Italic
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        // Links
        const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (trimmed === '') {
      flushList();
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={i} className="mb-2 mt-4 text-sm font-semibold text-gray-900 dark:text-white">
          {trimmed.slice(4)}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className="mb-2 mt-4 text-base font-semibold text-gray-900 dark:text-white">
          {trimmed.slice(3)}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={i} className="mb-3 mt-4 text-lg font-bold text-gray-900 dark:text-white">
          {trimmed.slice(2)}
        </h2>
      );
      continue;
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={i} className="my-2 text-sm text-gray-600 dark:text-gray-300">
        {formatInline(trimmed)}
      </p>
    );
  }

  flushList();
  return elements;
}

export function ReleaseNotes({ className = '' }: ReleaseNotesProps): React.ReactElement | null {
  const { state, isReleaseNotesVisible, hideReleaseNotes, downloadUpdate, installAndRestart } =
    useUpdateStore();
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch release notes when dialog opens
  useEffect(() => {
    if (isReleaseNotesVisible && !releaseNotes) {
      setLoading(true);

      // Use state release notes or fetch from API
      if (state.releaseNotes) {
        setReleaseNotes(state.releaseNotes);
        setLoading(false);
      } else if (window.electron) {
        window.electron
          .getReleaseNotes()
          .then((notes) => {
            setReleaseNotes(notes || 'No release notes available.');
          })
          .catch(() => {
            setReleaseNotes('Failed to load release notes.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [isReleaseNotesVisible, releaseNotes, state.releaseNotes]);

  if (!isReleaseNotesVisible) {
    return null;
  }

  const isDownloaded = state.status === 'downloaded';
  const isAvailable = state.status === 'available';

  const handlePrimaryAction = () => {
    if (isDownloaded) {
      installAndRestart();
    } else if (isAvailable) {
      downloadUpdate();
      hideReleaseNotes();
    }
  };

  return (
    <Dialog open={isReleaseNotesVisible} onOpenChange={hideReleaseNotes}>
      <DialogContent className={`max-w-lg ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Release Notes - v{state.availableVersion}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            </div>
          ) : releaseNotes ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {parseMarkdown(releaseNotes)}
            </div>
          ) : (
            <p className="text-center text-gray-500">No release notes available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4 dark:border-gray-700">
          <a
            href="https://github.com/paperflow/paperflow/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View full changelog
          </a>

          <div className="flex gap-2">
            <Button onClick={hideReleaseNotes} variant="secondary" size="sm">
              Close
            </Button>
            {(isAvailable || isDownloaded) && (
              <Button onClick={handlePrimaryAction} variant="primary" size="sm">
                {isDownloaded ? 'Restart Now' : 'Download Update'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReleaseNotes;
