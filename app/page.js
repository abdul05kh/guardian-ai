'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    let result;
    if (isLogin) {
      result = await loginWithEmail(email, password);
    } else {
      result = await signupWithEmail(email, password, displayName);
    }
    if (!result.success) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSubmitting(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.error);
    }
    setSubmitting(false);
  };

  if (loading || user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }}></div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {user ? 'Redirecting to dashboard...' : 'Initializing...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          background: var(--bg-primary);
          position: relative;
          overflow: hidden;
        }
        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .login-bg .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
        }
        .login-bg .orb-1 {
          width: 600px;
          height: 600px;
          background: var(--blue-primary);
          top: -200px;
          right: -100px;
          animation: float 20s ease-in-out infinite;
        }
        .login-bg .orb-2 {
          width: 500px;
          height: 500px;
          background: var(--purple-primary);
          bottom: -200px;
          left: -100px;
          animation: float 25s ease-in-out infinite reverse;
        }
        .login-bg .orb-3 {
          width: 300px;
          height: 300px;
          background: var(--cyan-primary);
          top: 50%;
          left: 40%;
          animation: float 15s ease-in-out infinite 5s;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 10px) scale(1.02); }
        }
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 80px;
          position: relative;
          z-index: 1;
        }
        .login-right {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: var(--radius-full);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: var(--blue-glow);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 28px;
          width: fit-content;
        }
        .hero-title {
          font-family: var(--font-heading);
          font-size: 52px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }
        .hero-title .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-desc {
          font-size: 17px;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 520px;
          margin-bottom: 40px;
        }
        .hero-stats {
          display: flex;
          gap: 40px;
        }
        .hero-stat {
          text-align: left;
        }
        .hero-stat .stat-value {
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 700;
          color: var(--blue-glow);
        }
        .hero-stat .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-xl);
          padding: 36px;
          box-shadow: var(--shadow-lg);
        }
        .login-card-title {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .login-card-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 28px;
        }
        .google-btn {
          width: 100%;
          padding: 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-medium);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all var(--transition-fast);
          margin-bottom: 20px;
        }
        .google-btn:hover {
          border-color: var(--border-accent);
          background: var(--bg-card-hover);
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-subtle);
        }
        .divider span {
          font-size: 12px;
          color: var(--text-muted);
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .form-group input {
          width: 100%;
          padding: 10px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 14px;
          outline: none;
          transition: all var(--transition-fast);
        }
        .form-group input:focus {
          border-color: var(--blue-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 13px;
          color: var(--danger-glow);
          margin-bottom: 16px;
        }
        .submit-btn {
          width: 100%;
          padding: 12px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--gradient-primary);
          color: white;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-glow-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .toggle-link {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .toggle-link button {
          background: none;
          border: none;
          color: var(--blue-glow);
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          font-family: var(--font-body);
        }
        .toggle-link button:hover {
          text-decoration: underline;
        }
        @media (max-width: 900px) {
          .login-page { flex-direction: column; }
          .login-left { padding: 40px 24px; }
          .login-right { width: 100%; padding: 0 24px 40px; }
          .hero-title { font-size: 36px; }
          .hero-stats { gap: 24px; flex-wrap: wrap; }
        }
      `}</style>

      {/* Background */}
      <div className="login-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Left - Hero */}
      <div className="login-left">
        <div className="hero-badge">
          🛡️ Google Solution Challenge 2026 — Build with AI
        </div>
        <h1 className="hero-title">
          <span className="gradient-text">Guardian AI</span>
          <br />
          Protect. Respond.
          <br />
          Comply.
        </h1>
        <p className="hero-desc">
          Industry-first unified platform fusing real-time Digital Asset Protection 
          with AI-powered Crisis Response — entirely on Google Cloud. Sub-90 second 
          piracy detection. Sub-3 minute crisis response. Cryptographic audit trails.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="stat-value">$71.3B</div>
            <div className="stat-label">Piracy market addressed</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">&lt;90s</div>
            <div className="stat-label">Detection latency</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">&lt;3min</div>
            <div className="stat-label">Crisis response</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">23</div>
            <div className="stat-label">Google technologies</div>
          </div>
        </div>
      </div>

      {/* Right - Login Card */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-title">{isLogin ? 'Welcome back' : 'Create account'}</div>
          <div className="login-card-subtitle">
            {isLogin ? 'Sign in to your Guardian AI platform' : 'Start protecting your digital assets'}
          </div>

          <button className="google-btn" onClick={handleGoogleLogin} disabled={submitting}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider"><span>or</span></div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="toggle-link">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
