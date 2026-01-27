import { useCallback, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Copy,
  Trash2,
  RotateCw,
  RotateCcw,
  FilePlus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@utils/cn';

export interface PageContextMenuProps {
  children: React.ReactNode;
  pageCount: number;
  isSelected: boolean;
  selectedCount: number;
  onDelete: () => void;
  onDeleteSelected: () => void;
  onDuplicate: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onRotate180: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onMoveTo: () => void;
  onExtract: () => void;
}

const menuItemClass = cn(
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
  'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900',
  'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100'
);

const menuSeparatorClass = 'my-1 h-px bg-gray-200 dark:bg-gray-700';

export function PageContextMenu({
  children,
  pageCount,
  isSelected,
  selectedCount,
  onDelete,
  onDeleteSelected,
  onDuplicate,
  onRotateCW,
  onRotateCCW,
  onRotate180,
  onInsertBefore,
  onInsertAfter,
  onMoveTo,
  onExtract,
}: PageContextMenuProps) {
  const [open, setOpen] = useState(false);
  const canDelete = pageCount > 1;
  const canDeleteSelected = pageCount > selectedCount && selectedCount > 0;
  const hasMultipleSelected = selectedCount > 1;

  const handleAction = useCallback(
    (action: () => void) => {
      return () => {
        action();
        setOpen(false);
      };
    },
    []
  );

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'z-50 min-w-[180px] rounded-md border border-gray-200 bg-white p-1 shadow-md',
            'dark:border-gray-700 dark:bg-gray-900'
          )}
          sideOffset={5}
          align="start"
        >
          {/* Selection info */}
          {hasMultipleSelected && (
            <>
              <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                {selectedCount} pages selected
              </div>
              <DropdownMenu.Separator className={menuSeparatorClass} />
            </>
          )}

          {/* Duplicate */}
          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={handleAction(onDuplicate)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate {hasMultipleSelected && isSelected ? 'Selected' : 'Page'}
          </DropdownMenu.Item>

          {/* Rotate submenu */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={cn(menuItemClass, 'pr-1')}>
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className={cn(
                  'z-50 min-w-[140px] rounded-md border border-gray-200 bg-white p-1 shadow-md',
                  'dark:border-gray-700 dark:bg-gray-900'
                )}
                sideOffset={2}
                alignOffset={-5}
              >
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={handleAction(onRotateCW)}
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  90° Clockwise
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={handleAction(onRotateCCW)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  90° Counter-clockwise
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={handleAction(onRotate180)}
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  180°
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Separator className={menuSeparatorClass} />

          {/* Insert blank page */}
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={cn(menuItemClass, 'pr-1')}>
              <FilePlus className="mr-2 h-4 w-4" />
              Insert Blank Page
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                className={cn(
                  'z-50 min-w-[140px] rounded-md border border-gray-200 bg-white p-1 shadow-md',
                  'dark:border-gray-700 dark:bg-gray-900'
                )}
                sideOffset={2}
                alignOffset={-5}
              >
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={handleAction(onInsertBefore)}
                >
                  Before This Page
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={handleAction(onInsertAfter)}
                >
                  After This Page
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {/* Move to */}
          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={handleAction(onMoveTo)}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Move to...
          </DropdownMenu.Item>

          {/* Extract */}
          <DropdownMenu.Item
            className={menuItemClass}
            onSelect={handleAction(onExtract)}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Extract {hasMultipleSelected && isSelected ? 'Selected' : 'Page'}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className={menuSeparatorClass} />

          {/* Delete */}
          {hasMultipleSelected && isSelected ? (
            <DropdownMenu.Item
              className={cn(
                menuItemClass,
                'text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700',
                'dark:text-red-400 dark:data-[highlighted]:bg-red-900/20 dark:data-[highlighted]:text-red-300'
              )}
              onSelect={handleAction(onDeleteSelected)}
              disabled={!canDeleteSelected}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedCount})
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className={cn(
                menuItemClass,
                'text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700',
                'dark:text-red-400 dark:data-[highlighted]:bg-red-900/20 dark:data-[highlighted]:text-red-300'
              )}
              onSelect={handleAction(onDelete)}
              disabled={!canDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Page
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
