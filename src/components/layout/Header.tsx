import { FileUp, Save, Download, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { ThemeToggle } from '@components/ui/ThemeToggle';
import { useDocumentStore } from '@stores/documentStore';

export function Header() {
  const fileName = useDocumentStore((state) => state.fileName);
  const isModified = useDocumentStore((state) => state.isModified);

  return (
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
        <ThemeToggle />
        <Link to="/settings">
          <Button variant="ghost" size="sm" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
