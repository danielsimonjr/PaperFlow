import { forwardRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { RotateCw, RotateCcw, ChevronDown } from 'lucide-react';
import { cn } from '@utils/cn';

export type RotationDirection = 'cw90' | 'ccw90' | '180';

export interface RotateMenuProps {
  onRotate: (direction: RotationDirection) => void;
  disabled?: boolean;
  className?: string;
}

const menuItemClass = cn(
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
  'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900',
  'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100'
);

/**
 * Dropdown menu component for page rotation options.
 * Can be used standalone in a toolbar or header.
 */
export const RotateMenu = forwardRef<HTMLButtonElement, RotateMenuProps>(
  ({ onRotate, disabled = false, className }, ref) => {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            ref={ref}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500',
              'dark:text-gray-300 dark:hover:bg-gray-800',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
          >
            <RotateCw className="h-4 w-4" />
            Rotate
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(
              'z-50 min-w-[160px] rounded-md border border-gray-200 bg-white p-1 shadow-md',
              'dark:border-gray-700 dark:bg-gray-900',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
            sideOffset={5}
            align="start"
          >
            <DropdownMenu.Item
              className={menuItemClass}
              onSelect={() => onRotate('cw90')}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              90° Clockwise
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={menuItemClass}
              onSelect={() => onRotate('ccw90')}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              90° Counter-clockwise
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={menuItemClass}
              onSelect={() => onRotate('180')}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              180°
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }
);

RotateMenu.displayName = 'RotateMenu';
