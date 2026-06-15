import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, resetPassword, quickBypassLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const { logoUrl } = useSettings();

  const isLoggingIn = React.useRef(false);

  const handleForgotPassword = async () => {
    if (!identifier) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // If they used a username, we can look up the email
      let resetEmail = identifier;
      if (!identifier.includes('@')) {
        const response = await fetch('/api/get-email-by-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier.trim() })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Username or Registration Number not found.');
        }
        
        const data = await response.json();
        resetEmail = data.email;
      }
      await resetPassword(resetEmail);
      setSuccess(`A password reset link has been sent to ${resetEmail}. Please check your inbox.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;
    setLoading(true);
    setError('');
    try {
      const success = await loginWithGoogle();
      if (success) {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google login');
    } finally {
      setLoading(false);
      isLoggingIn.current = false;
    }
  };

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;
    setLoading(true);
    setError('');
    try {
      const success = await login(identifier, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
      isLoggingIn.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 flex flex-col items-center p-4 overflow-y-auto">
      <div className="flex-grow"></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 backdrop-blur-xl p-8 my-8 flex-shrink-0">
        <div className="text-center mb-8">
          {logoUrl && (
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-50 inline-block mb-6 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src={logoUrl} alt="Endless Spark Logo" className="h-32 md:h-40 object-contain mx-auto relative z-10 transition-transform duration-500 group-hover:scale-110" />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2 text-green-600 text-sm">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{success}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username, Registration Number or Email</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter username, reg number, or email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-pink-600 hover:underline font-bold transition-all active:scale-95"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-4 w-full btn-social group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          {window.self !== window.top && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-900 leading-relaxed text-left">
              <div className="flex gap-1.5 font-bold mb-1 items-center">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                <span>Google Passkey Prompt?</span>
              </div>
              <p className="text-gray-600">
                Because of browser sandboxing, Google may force a <strong>Passkey</strong> challenge inside the iframe preview.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-dashed border-gray-100 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Fast-Track Role Access:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickBypassLogin('admin')}
                className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl border border-indigo-100 transition-all flex flex-col items-center justify-center overflow-hidden"
              >
                <span>Admin</span>
                <span className="text-[8px] text-indigo-400 font-normal truncate max-w-full">admin@...</span>
              </button>
              <button
                type="button"
                onClick={() => quickBypassLogin('telecaller')}
                className="py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold rounded-xl border border-pink-100 transition-all flex flex-col items-center justify-center overflow-hidden"
              >
                <span>Sales (CRM)</span>
                <span className="text-[8px] text-pink-400 font-normal truncate max-w-full">telecaller@...</span>
              </button>
              <button
                type="button"
                onClick={() => quickBypassLogin('marketing')}
                className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-100 transition-all flex flex-col items-center justify-center overflow-hidden"
              >
                <span>Marketing</span>
                <span className="text-[8px] text-emerald-400 font-normal truncate max-w-full">marketing@...</span>
              </button>
            </div>
          </div>


        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-pink-600 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link to="/privacy" className="hover:text-pink-600 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-pink-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="flex-grow"></div>
    </div>
  );
}
