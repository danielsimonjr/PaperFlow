import { useState } from 'react';
import { ChevronLeft, ChevronRight, Layers, Bookmark, FileText } from 'lucide-react';
import { ThumbnailSidebar } from '@components/sidebar/ThumbnailSidebar';
import { OutlinePanel } from '@components/sidebar/OutlinePanel';
import { cn } from '@utils/cn';

type SidebarTab = 'thumbnails' | 'outline' | 'annotations';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('thumbnails');

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-gray-950',
        isCollapsed ? 'w-12' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('thumbnails')}
              className={cn(
                'rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                activeTab === 'thumbnails' && 'bg-gray-100 dark:bg-gray-800'
              )}
              title="Page Thumbnails"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTab('outline')}
              className={cn(
                'rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                activeTab === 'outline' && 'bg-gray-100 dark:bg-gray-800'
              )}
              title="Bookmarks"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTab('annotations')}
              className={cn(
                'rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                activeTab === 'annotations' && 'bg-gray-100 dark:bg-gray-800'
              )}
              title="Annotations"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab === 'thumbnails' && (
            <ThumbnailSidebar className="flex-1" />
          )}
          {activeTab === 'outline' && (
            <OutlinePanel className="flex-1" />
          )}
          {activeTab === 'annotations' && (
            <div className="flex-1 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No annotations yet
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
