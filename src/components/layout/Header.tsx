import { useState } from 'react';
import { FileUp, Save, Download, Settings, Printer, Image, Minimize2, Mail, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { ThemeToggle } from '@components/ui/ThemeToggle';
import { useDocumentStore } from '@stores/documentStore';
import { ImageExportDialog } from '@components/export/ImageExportDialog';
import { CompressDialog } from '@components/export/CompressDialog';
import { PrintDialog } from '@components/print/PrintDialog';
import { openEmailWithDocument } from '@lib/share/emailShare';
import { copyLinkToClipboard, isDocumentFromUrl } from '@lib/share/copyLink';

export function Header() {
  const fileName = useDocumentStore((state) => state.fileName);
  const isModified = useDocumentStore((state) => state.isModified);

  const [showImageExport, setShowImageExport] = useState(false);
  const [showCompress, setShowCompress] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const documentUrl = typeof window !== 'undefined' ? window.location.href : null;
  const hasUrlSource = isDocumentFromUrl(documentUrl);

  const handleEmail = () => {
    openEmailWithDocument(fileName ?? 'document.pdf', hasUrlSource ? documentUrl ?? undefined : undefined);
  };

  const handleCopyLink = async () => {
    if (documentUrl) {
      const success = await copyLinkToClipboard(documentUrl);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-900 text-white">
              <FileUp className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              PaperFlow
            </span>
          </Link>

          {fileName && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-gray-400">/</span>
              <span>
                {fileName}
                {isModified && <span className="ml-1 text-primary-500">*</span>}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="Save">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Download">
            <Download className="h-4 w-4" />
          </Button>

          {/* Sprint 9: Export, Print, Share */}
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <Button variant="ghost" size="sm" title="Export as Image" onClick={() => setShowImageExport(true)}>
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Compress PDF" onClick={() => setShowCompress(true)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Print" onClick={() => setShowPrint(true)}>
            <Printer className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <Button variant="ghost" size="sm" title="Email Document" onClick={handleEmail}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={copySuccess ? 'Copied!' : 'Copy Link'}
            onClick={handleCopyLink}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <ThemeToggle />
          <Link to="/settings">
            <Button variant="ghost" size="sm" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Dialogs */}
      <ImageExportDialog isOpen={showImageExport} onClose={() => setShowImageExport(false)} />
      <CompressDialog isOpen={showCompress} onClose={() => setShowCompress(false)} />
      <PrintDialog isOpen={showPrint} onClose={() => setShowPrint(false)} />
    </>
  );
}
