import { Header } from '@components/layout/Header';
import { Sidebar } from '@components/layout/Sidebar';
import { Toolbar } from '@components/layout/Toolbar';
import { PDFViewer } from '@components/viewer/PDFViewer';

export default function Editor() {
  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <PDFViewer />
        </main>
      </div>
    </div>
  );
}
