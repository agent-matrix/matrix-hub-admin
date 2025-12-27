import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card } from '@/components/ui';
import { Box, Shield, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/catalog');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        router.push('/catalog');
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
      }
    }, 500);
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-full h-96 bg-indigo-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/50">
            <Box className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Matrix Hub Admin
          </h1>
          <p className="text-zinc-400">
            Sign in to access the admin console
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-rose-400 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-bold text-zinc-300 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter your username"
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-zinc-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center !py-3"
              icon={Shield}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-zinc-500 text-center">
              Default credentials:{' '}
              <span className="font-mono text-zinc-400">admin / admin</span>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-8">
          Matrix Hub Admin Console v1.4.2
        </p>
      </div>
    </div>
  );
}
