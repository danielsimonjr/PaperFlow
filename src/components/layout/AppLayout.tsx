import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showToolbar?: boolean;
}

/**
 * Main application layout using CSS Grid.
 * Provides fixed header/toolbar and scrollable content area.
 */
export function AppLayout({
  children,
  showSidebar = true,
  showToolbar = true,
}: AppLayoutProps) {
  return (
    <div className="grid h-screen grid-rows-[auto_auto_1fr] bg-gray-100 dark:bg-gray-900">
      {/* Fixed Header */}
      <Header />

      {/* Fixed Toolbar */}
      {showToolbar && <Toolbar />}

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Resizable Sidebar */}
        {showSidebar && <Sidebar />}

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

/**
 * Minimal layout for simple pages (settings, 404, etc.)
 */
interface MinimalLayoutProps {
  children: ReactNode;
}

export function MinimalLayout({ children }: MinimalLayoutProps) {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr] bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="overflow-auto">{children}</main>
    </div>
  );
}
