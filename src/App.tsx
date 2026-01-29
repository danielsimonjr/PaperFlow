import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingIndicator } from '@components/ui/LoadingIndicator';

// Lazy-loaded route components for code splitting
const Home = lazy(() => import('@/pages/Home'));
const Editor = lazy(() => import('@/pages/Editor'));
const Settings = lazy(() => import('@/pages/Settings'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function PageLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
      <LoadingIndicator />
    </div>
  );
}

export default App;
