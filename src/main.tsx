import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Use HashRouter for Electron (file:// protocol) since BrowserRouter requires a server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isElectron = typeof (window as any).electron !== 'undefined' ||
  window.location.protocol === 'file:';

const Router = isElectron ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
