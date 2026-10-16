import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsertPageDialog } from '@components/pages/InsertPageDialog';

// The thumbnail sidebar keeps this dialog mounted. Its menu sets the position and then opens the dialog.
function Sidebar({ onInsert }: { onInsert: (position: 'before' | 'after', size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<'before' | 'after'>('after');
  return (
    <>
      <button
        onClick={() => {
          setPosition('before');
          setOpen(true);
        }}
      >
        menu-before
      </button>
      <button
        onClick={() => {
          setPosition('after');
          setOpen(true);
        }}
      >
        menu-after
      </button>
      <InsertPageDialog
        open={open}
        onOpenChange={setOpen}
        currentPageIndex={0}
        pageCount={3}
        position={position}
        onInsert={onInsert}
      />
    </>
  );
}

const radio = (name: RegExp) => screen.getByRole('radio', { name }) as HTMLInputElement;

describe('InsertPageDialog position', () => {
  it('show the position that the menu chose on the first open', () => {
    render(<Sidebar onInsert={vi.fn()} />);
    fireEvent.click(screen.getByText('menu-before'));

    expect(radio(/before page 1/i).checked).toBe(true);
    expect(radio(/after page 1/i).checked).toBe(false);
  });

  it('show the position that the menu chose on a later open', () => {
    const onInsert = vi.fn();
    render(<Sidebar onInsert={onInsert} />);

    fireEvent.click(screen.getByText('menu-after'));
    expect(radio(/after page 1/i).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    fireEvent.click(screen.getByText('menu-before'));

    expect(radio(/before page 1/i).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /insert page/i }));
    expect(onInsert).toHaveBeenCalledWith('before', 'match');
  });

  it('insert at the position that the menu chose, not at the position of the previous open', () => {
    const onInsert = vi.fn();
    render(<Sidebar onInsert={onInsert} />);

    fireEvent.click(screen.getByText('menu-before'));
    fireEvent.click(screen.getByRole('button', { name: /insert page/i }));
    expect(onInsert).toHaveBeenLastCalledWith('before', 'match');

    fireEvent.click(screen.getByText('menu-after'));
    fireEvent.click(screen.getByRole('button', { name: /insert page/i }));
    expect(onInsert).toHaveBeenLastCalledWith('after', 'match');
  });

  it('keep a position that the user picked in the dialog while the dialog stays open', () => {
    const onInsert = vi.fn();
    render(<Sidebar onInsert={onInsert} />);

    fireEvent.click(screen.getByText('menu-after'));
    fireEvent.click(radio(/before page 1/i));
    fireEvent.click(screen.getByRole('button', { name: /insert page/i }));

    expect(onInsert).toHaveBeenCalledWith('before', 'match');
  });
});
