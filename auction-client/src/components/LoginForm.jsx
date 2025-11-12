import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginForm.css';

export default function LoginForm() {
  const { login, register, loading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (isRegisterMode) {
      if (!formData.role) {
        setError('Please select a role (Buyer or Seller)');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.email && !formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    const result = isRegisterMode
      ? await register(formData.username, formData.password, formData.email, formData.role)
      : await login(formData.username, formData.password);

    if (!result.success) {
      setError(result.error || 'Authentication failed');
    } else {
      setSuccess(isRegisterMode ? 'Registration successful! Redirecting...' : 'Login successful! Redirecting...');
    }
  };

  const fillDemo = () => {
    setFormData((f) => ({ ...f, username: 'demo_user', password: 'demo_pass' }));
    setError('');
    setSuccess('Filled demo credentials — press Sign In');
    setTimeout(() => setSuccess(''), 2500);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      password: '',
      email: '',
      confirmPassword: '',
      role: '',
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegisterMode ? 'Sign up to start bidding' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={loading}
              required
            />
          </div>

          {isRegisterMode && (
            <>
              <div className="form-group">
                <label htmlFor="role">I want to be a</label>
                <div className="role-selection">
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="BUYER"
                      checked={formData.role === 'BUYER'}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <span className="role-label">
                      <span className="role-icon">🛒</span>
                      <span>Buyer</span>
                    </span>
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="SELLER"
                      checked={formData.role === 'SELLER'}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <span className="role-label">
                      <span className="role-icon">🏪</span>
                      <span>Seller</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (Optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>✓</span> {success}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <span className="button-loading">
                <span className="spinner"></span> Processing...
              </span>
            ) : (
              isRegisterMode ? 'Sign Up' : 'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className="link-button"
              disabled={loading}
            >
              {isRegisterMode ? ' Sign In' : ' Sign Up'}
            </button>
          </p>
          {!isRegisterMode && (
            <div style={{ marginTop: 8 }}>
              <small className="muted">Need a quick test account?</small>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button type="button" className="btn btn-outline" onClick={fillDemo} disabled={loading}>
                  Use Demo Account
                </button>
                <div style={{ alignSelf: 'center', fontSize: 13 }}>
                  <strong>demo_user</strong> / <em>demo_pass</em>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
