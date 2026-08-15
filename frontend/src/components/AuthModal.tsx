import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('test@example.com');
    setPassword('password123');
    setMode('login');
    setError(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'login' ? 'Sign in to BillGPT' : 'Create an Account'}
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="auth-tab-row">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password (min 6 chars)</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div className="demo-badge">Quick Demo Access</div>
          <p className="demo-text">
            Use pre-seeded local credentials: <code>test@example.com</code> / <code>password123</code>
          </p>
          <button
            type="button"
            className="demo-fill-btn"
            onClick={fillDemoAccount}
          >
            ⚡ Autofill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
