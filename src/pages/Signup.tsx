import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserPlus, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { logoUrl, loading: settingsLoading } = useSettings();
  const isLoggingIn = React.useRef(false);

  const handleGoogleLogin = async () => {
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;
    setLoading(true);
    setError('');
    try {
      const success = await loginWithGoogle();
      if (success) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google login');
    } finally {
      setLoading(false);
      isLoggingIn.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;
    setLoading(true);
    setError('');
    try {
      const signupData = {
        ...formData,
        username: formData.username.toLowerCase().trim(),
        email: formData.email.toLowerCase().trim()
      };
      const success = await signup(signupData);
      if (success) {
        navigate('/');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
      isLoggingIn.current = false;
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              placeholder="johndoe123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

          <div className="flex items-start">
            <input
              id="signup-acknowledgment"
              type="checkbox"
              required
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-1 cursor-pointer"
            />
            <label htmlFor="signup-acknowledgment" className="ml-2 text-sm text-gray-600">
              I strictly acknowledge the <Link to="/privacy" className="text-pink-600 hover:underline">Privacy Policy</Link>, <Link to="/terms" className="text-pink-600 hover:underline">Terms & Conditions</Link>, and Course Material Copyright Information without fail.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
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
            type="button"
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
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-pink-600 font-bold hover:underline">
              Log In
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
