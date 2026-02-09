'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { getErrorMessage } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      router.push('/login?registered=true');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-light">Join <span className="text-accent">Ticketa</span></h1>
          <p className="text-sm text-light-muted mt-1">Start booking amazing events today</p>
        </div>

        <div className="bg-dark-secondary rounded-xl border border-border-strong shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-light-muted mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => update('username', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
                placeholder="set your username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-muted mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light-muted mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-muted mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-dark-primary text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-light-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
