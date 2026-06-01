import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import revenueCatService from '../../lib/revenuecat';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Users, Lock, Crown, AlertCircle, MessageSquare, Globe } from 'lucide-react';

const AuthManager = ({ onAuthChange }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const translations = {
    en: {
      welcome: 'BeautySync Pro',
      subtitle: 'Elevate your salon experience',
      japanese: '美しさを同期する。',
      login: 'Sign In',
      signup: 'Create Account',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      loginButton: 'Enter Studio',
      signupButton: 'Launch Your Salon',
      guestLogin: 'Try as Guest',
      switchToSignup: 'Need an account?',
      switchToLogin: 'Already have an account?',
      logout: 'Sign Out',
      feedback: 'Send Feedback',
      processing: 'Processing...',
      error: 'Authentication Error'
    },
    ja: {
      welcome: 'BeautySync Pro',
      subtitle: 'サロン体験を向上させる',
      japanese: '美しさを同期する。',
      login: 'ログイン',
      signup: 'アカウント作成',
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード確認',
      loginButton: 'スタジオに入る',
      signupButton: 'サロンを開始',
      guestLogin: 'ゲストとして試す',
      switchToSignup: 'アカウントが必要ですか？',
      switchToLogin: '既にアカウントをお持ちですか？',
      logout: 'ログアウト',
      feedback: 'フィードバック送信',
      processing: '処理中...',
      error: '認証エラー'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        try {
          await revenueCatService.initialize(user.uid);
          
          // Create user profile if it doesn't exist
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email || 'anonymous',
              createdAt: new Date(),
              isAnonymous: user.isAnonymous,
              lastLogin: new Date()
            });
          } else {
            // Update last login
            await setDoc(doc(db, 'users', user.uid), {
              lastLogin: new Date()
            }, { merge: true });
          }
        } catch (error) {
          console.error('User setup error:', error);
        }
      }
      
      onAuthChange?.(user);
    });

    return () => unsubscribe();
  }, [onAuthChange]);

  const onSubmit = async (data) => {
    setError('');
    setIsProcessing(true);
    
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      } else {
        if (data.password !== data.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      }
      reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setIsProcessing(true);
    
    try {
      await signInAnonymously(auth);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await revenueCatService.logout();
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const sendFeedback = () => {
    // Placeholder feedback functionality
    alert('Feedback feature coming soon!');
    setShowFeedback(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="animate-pulse text-coral opacity-60">
          <Crown className="w-8 h-8 mx-auto mb-2" />
          <div className="font-mono text-xs uppercase tracking-wider">Loading Studio</div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-coral/8 via-pink/6 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 py-8 max-w-2xl relative z-10">
          {/* Header */}
          <div className="mb-8 text-center" style={{ animation: 'fadeInUp 0.6s ease both' }}>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-coral/10 border border-coral/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-coral" />
              </div>
              <h1 className="text-3xl font-light text-primary font-serif">{t.welcome}</h1>
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-coral/60 mb-2">
              Authenticated Studio
            </div>
            <p className="text-sm text-secondary">{t.japanese}</p>
          </div>

          {/* User Info */}
          <div 
            className="bg-coral/4 border border-coral/18 rounded-2xl p-6 mb-6"
            style={{ animation: 'fadeInUp 0.6s ease 0.15s both' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-primary font-light text-lg mb-1">
                  {user.isAnonymous ? 'Guest User' : user.email}
                </div>
                <div className="font-mono text-xs text-coral/60 uppercase tracking-wider">
                  {user.isAnonymous ? 'Trial Mode' : 'Registered User'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
                  className="pill-button text-coral border-coral/35 hover:border-coral/60"
                  title="Switch Language"
                >
                  <Globe className="w-3 h-3" />
                  <span>{language.toUpperCase()}</span>
                </button>
                <button
                  onClick={() => setShowFeedback(true)}
                  className="pill-button text-coral border-coral/35 hover:border-coral/60"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{t.feedback}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="pill-button text-secondary border-secondary/35 hover:border-secondary/60"
                >
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>
            
            {user.isAnonymous && (
              <div className="bg-coral/6 border border-coral/15 rounded-xl p-4">
                <div className="flex items-center gap-2 text-coral/80 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Guest access - Create an account to save your data</span>
                </div>
              </div>
            )}
          </div>

          {/* Welcome Message */}
          <div 
            className="text-center py-12"
            style={{ animation: 'fadeInUp 0.6s ease 0.3s both' }}
          >
            <h2 className="text-2xl font-light text-primary mb-4 font-serif">
              Welcome to your beauty studio
            </h2>
            <p className="text-secondary leading-relaxed mb-6">
              Your salon management dashboard is ready. Track clients, manage appointments, 
              and grow your business with intelligent automation.
            </p>
            <div className="font-mono text-xs text-coral/60 uppercase tracking-wider">
              Ready to sync your success
            </div>
          </div>
        </div>

        {/* Feedback Modal */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0b0b0f] border border-coral/20 rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-light text-primary mb-4">Send Feedback</h3>
              <p className="text-secondary text-sm mb-4">
                Help us improve BeautySync Pro. Your feedback matters.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={sendFeedback}
                  className="pill-button text-coral border-coral/35 hover:border-coral/60 flex-1"
                >
                  Send
                </button>
                <button
                  onClick={() => setShowFeedback(false)}
                  className="pill-button text-secondary border-secondary/35 hover:border-secondary/60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center relative">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-coral/8 via-pink/6 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8" style={{ animation: 'fadeInUp 0.6s ease both' }}>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-coral/10 border border-coral/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-coral" />
            </div>
            <h1 className="text-4xl font-light text-primary font-serif">{t.welcome}</h1>
          </div>
          <p className="text-secondary text-lg font-light leading-relaxed mb-2">
            {t.subtitle}
          </p>
          <p className="text-sm text-coral/60 font-light">
            {t.japanese}
          </p>
        </div>

        {/* Auth Form */}
        <div 
          className="bg-coral/4 border border-coral/18 rounded-2xl p-6 mb-6"
          style={{ animation: 'fadeInUp 0.6s ease 0.15s both' }}
        >
          <div className="flex mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 rounded-l-lg border-l border-t border-b transition-all ${
                authMode === 'login'
                  ? 'border-coral/35 bg-coral/6 text-coral'
                  : 'border-coral/15 bg-transparent text-secondary hover:text-primary'
              }`}
            >
              <div className="font-mono text-xs uppercase tracking-wider">{t.login}</div>
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 px-4 rounded-r-lg border-r border-t border-b transition-all ${
                authMode === 'signup'
                  ? 'border-coral/35 bg-coral/6 text-coral'
                  : 'border-coral/15 bg-transparent text-secondary hover:text-primary'
              }`}
            >
              <div className="font-mono text-xs uppercase tracking-wider">{t.signup}</div>
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-coral/60 mb-2">
                {t.email}
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="auth-input"
                placeholder="your@email.com"
                disabled={isProcessing}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-coral/60 mb-2">
                {t.password}
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input pr-10"
                  placeholder="••••••••"
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-coral/60 mb-2">
                  {t.confirmPassword}
                </label>
                <input
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password'
                  })}
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  disabled={isProcessing}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full pill-button bg-coral/10 text-coral border-coral/35 hover:border-coral/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t.processing : (authMode === 'login' ? t.loginButton : t.signupButton)}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-coral/10">
            <button
              onClick={handleAnonymousLogin}
              disabled={isProcessing}
              className="w-full pill-button text-secondary border-secondary/35 hover:border-secondary/60 disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              <span>{t.guestLogin}</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-sm text-secondary hover:text-coral transition-colors"
            >
              {authMode === 'login' ? t.switchToSignup : t.switchToLogin}
            </button>
          </div>
        </div>

        {/* Language Toggle */}
        <div 
          className="flex justify-center gap-4 mb-6"
          style={{ animation: 'fadeInUp 0.6s ease 0.3s both' }}
        >
          <button
            onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
            className="pill-button text-coral border-coral/35 hover:border-coral/60"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'en' ? '日本語' : 'English'}</span>
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="pill-button text-secondary border-secondary/35 hover:border-secondary/60"
          >
            <MessageSquare className="w-3 h-3" />
            <span>{t.feedback}</span>
          </button>
        </div>

        {/* Footer */}
        <div 
          className="text-center"
          style={{ animation: 'fadeInUp 0.6s ease 0.45s both' }}
        >
          <div className="font-mono text-xs text-coral/40 uppercase tracking-wider">
            Your beauty business, synchronized
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0b0b0f] border border-coral/20 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-light text-primary mb-4">Send Feedback</h3>
            <p className="text-secondary text-sm mb-4">
              Help us improve BeautySync Pro. Your feedback shapes our future.
            </p>
            <div className="flex gap-3">
              <button
                onClick={sendFeedback}
                className="pill-button text-coral border-coral/35 hover:border-coral/60 flex-1"
              >
                Send
              </button>
              <button
                onClick={() => setShowFeedback(false)}
                className="pill-button text-secondary border-secondary/35 hover:border-secondary/60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pill-button {
          @apply inline-flex items-center gap-2 px-6 py-2 rounded-full border text-xs font-mono uppercase tracking-wider transition-all duration-200;
        }
        .pill-button:hover {
          @apply -translate-y-0.5;
        }
        .pill-button:active {
          @apply translate-y-0 scale-95;
        }
        .auth-input {
          @apply w-full px-4 py-3 bg-coral/2 border border-coral/18 rounded-xl text-primary placeholder-secondary/50 transition-all duration-200;
        }
        .auth-input:focus {
          @apply outline-none border-coral/45 bg-coral/4;
        }
        .text-primary {
          color: rgba(245,240,250,0.92);
        }
        .text-secondary {
          color: rgba(245,240,250,0.45);
        }
        .text-coral {
          color: #f07a6a;
        }
        .text-pink {
          color: #f0c4d4;
        }
        .bg-gradient-radial {
          background: radial-gradient(ellipse, var(--tw-gradient-stops));
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AuthManager;