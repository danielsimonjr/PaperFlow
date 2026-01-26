import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
      <h1 className="mb-2 text-6xl font-bold text-gray-900 dark:text-white">
        404
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">Page not found</p>
      <Link to="/">
        <Button variant="primary">
          <Home className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </Link>
    </div>
  );
}
