import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Editor from '@/pages/Editor';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/editor" element={<Editor />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
