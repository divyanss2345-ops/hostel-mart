import { useState } from 'react';
import { Mail, Lock, LogIn, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { ButtonLoader } from '@/components/ui/Spinner';
import { navigateTo } from '@/lib/router';

export default function Login() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter your email and password.', 'error');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast(error, 'error');
      return;
    }
    toast('Welcome back!', 'success');
    navigateTo('/');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
            <Moon className="w-7 h-7 text-ink-950" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Welcome Back</h1>
          <p className="text-sm text-ink-400 mt-1">Sign in to order your late-night Maggie packets</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="you@hostel.edu"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <ButtonLoader /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-400 mt-6">
          New here?{' '}
          <button onClick={() => navigateTo('/register')} className="text-brand-400 hover:text-brand-300 font-semibold">
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
