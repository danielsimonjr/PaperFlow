import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import { Button } from '@components/ui/Button';

export function Terms() {
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
            <FileText className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last Updated: January 29, 2026
          </p>

          {/* Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Free to Use
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  No fees or subscriptions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                  Open Source
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  MIT License
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-300">
                  Use Responsibly
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Lawful purposes only
                </p>
              </div>
            </div>
          </div>

          {/* Full Terms */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2>Agreement to Terms</h2>
            <p>
              By accessing or using PaperFlow (the &quot;Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree
              to these Terms, please do not use the Service.
            </p>

            <h2>Description of Service</h2>
            <p>
              PaperFlow is a free, web-based PDF editor that runs entirely in
              your browser. The Service allows you to:
            </p>
            <ul>
              <li>View PDF documents</li>
              <li>Add annotations (highlights, notes, drawings)</li>
              <li>Fill and sign PDF forms</li>
              <li>Edit and manipulate PDF pages</li>
              <li>Export and print documents</li>
            </ul>
            <p>All document processing occurs locally on your device.</p>

            <h2>Acceptable Use</h2>
            <p>You agree to use PaperFlow only for lawful purposes. You may:</p>
            <ul>
              <li>Edit, annotate, and sign your own PDF documents</li>
              <li>Use the Service for personal or commercial purposes</li>
              <li>Install PaperFlow as a Progressive Web App on your device</li>
            </ul>

            <h2>Prohibited Use</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>
                Use the Service to process documents you don&apos;t have rights
                to
              </li>
              <li>
                Use the Service to create, distribute, or store illegal content
              </li>
              <li>Attempt to interfere with or disrupt the Service</li>
              <li>
                Use automated tools that create excessive load on the Service
              </li>
            </ul>

            <h2>User Responsibilities</h2>
            <h3>Document Ownership</h3>
            <p>You are solely responsible for:</p>
            <ul>
              <li>
                Ensuring you have the legal right to edit any documents you
                process
              </li>
              <li>The content of your documents and any annotations you add</li>
              <li>Backing up your important documents</li>
              <li>Saving your work before closing the application</li>
            </ul>

            <h3>Local Processing</h3>
            <p>Since PaperFlow processes documents locally:</p>
            <ul>
              <li>
                You are responsible for the security of your own device
              </li>
              <li>We cannot recover unsaved work or deleted files</li>
              <li>You should keep backups of important documents</li>
            </ul>

            <h2>Intellectual Property</h2>
            <h3>Open Source License</h3>
            <p>
              PaperFlow is released under the MIT License. You may use, copy,
              modify, and distribute the software subject to the conditions in
              the MIT License.
            </p>

            <h3>Your Content</h3>
            <p>
              You retain all rights to your documents and content. We do not
              claim any ownership of files you process with PaperFlow.
            </p>

            <h2>Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED. We do not warrant that the Service will meet your
              specific requirements, be uninterrupted, timely, secure, or
              error-free.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PAPERFLOW AND ITS
              DEVELOPERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL.
            </p>

            <h2>Changes to Service</h2>
            <p>
              We reserve the right to modify or discontinue the Service at any
              time, change features without prior notice, and update these Terms
              at any time.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about these Terms, please open an issue on{' '}
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
          <Link to="/privacy" className="hover:underline">
            Privacy Policy
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

export default Terms;
