import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to PaperFlow
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last Updated: January 29, 2026
          </p>

          {/* Privacy Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  No Document Access
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your files never leave your device
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  Local Processing
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  All editing happens in your browser
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-800 dark:text-purple-300">
                  Local Storage Only
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  Data stored only on your device
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Trash2 className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-300">
                  Easy Data Deletion
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Clear your data anytime
                </p>
              </div>
            </div>
          </div>

          {/* Full Policy */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>Our Privacy-First Approach</h2>
            <p>
              PaperFlow is designed with privacy as a core principle.{' '}
              <strong>Your documents never leave your device.</strong> All PDF
              processing, editing, and rendering happens entirely in your web
              browser using client-side technologies.
            </p>

            <h2>Information We Do NOT Collect</h2>
            <ul>
              <li>
                <strong>Document Content</strong>: We never see, access, store,
                or transmit your PDF files or their contents
              </li>
              <li>
                <strong>Personal Files</strong>: Your documents remain on your
                device at all times
              </li>
              <li>
                <strong>Signatures</strong>: Any signatures you create are
                stored only in your browser&apos;s local storage
              </li>
              <li>
                <strong>Form Data</strong>: Information you enter into PDF forms
                stays on your device
              </li>
            </ul>

            <h2>Information We May Collect</h2>
            <h3>Anonymous Usage Analytics</h3>
            <p>
              To improve PaperFlow, we may collect anonymous, aggregated data
              about how the application is used:
            </p>
            <ul>
              <li>Page views and feature usage (without identifying you)</li>
              <li>Performance metrics and page load times</li>
              <li>Anonymous error reports to help us fix bugs</li>
            </ul>
            <p>This data is:</p>
            <ul>
              <li>Completely anonymous (no personal identifiers)</li>
              <li>Aggregated across all users</li>
              <li>Used solely to improve the application</li>
              <li>Never sold to third parties</li>
            </ul>

            <h2>Local Storage</h2>
            <p>
              PaperFlow uses your browser&apos;s local storage features to
              enhance your experience:
            </p>
            <ul>
              <li>
                <strong>IndexedDB</strong>: Stores your saved signatures,
                stamps, and recent file list
              </li>
              <li>
                <strong>LocalStorage</strong>: Stores your preferences (theme,
                zoom level, tool settings)
              </li>
              <li>
                <strong>Service Worker Cache</strong>: Enables offline
                functionality
              </li>
            </ul>
            <p>
              You can clear this data at any time through your browser&apos;s
              settings or PaperFlow&apos;s Settings page.
            </p>

            <h2>Data Security</h2>
            <p>Since your documents never leave your device:</p>
            <ul>
              <li>There is no server-side data to breach</li>
              <li>Your files cannot be intercepted in transit</li>
              <li>No cloud storage means no cloud vulnerabilities</li>
            </ul>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong>: See what data is stored in your browser
              </li>
              <li>
                <strong>Delete</strong>: Clear all locally stored data at any
                time
              </li>
              <li>
                <strong>Portability</strong>: Export your signatures and
                settings
              </li>
            </ul>

            <h2>Open Source</h2>
            <p>
              PaperFlow is open source. You can review our code on{' '}
              <a
                href="https://github.com/danielsimonjr/PaperFlow"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>{' '}
              to verify our privacy claims or host your own instance for maximum
              privacy.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please open an
              issue on{' '}
              <a
                href="https://github.com/danielsimonjr/PaperFlow/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          <Link to="/terms" className="hover:underline">
            Terms of Service
          </Link>
          {' | '}
          <a
            href="https://github.com/danielsimonjr/PaperFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Privacy;
