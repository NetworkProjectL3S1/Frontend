import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShoppingCart, Store } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-6 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegisterMode ? 'Sign up to start bidding' : 'Sign in to your auction account'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
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
                <div className="space-y-2">
                  <Label>I want to be a</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`relative flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        formData.role === 'BUYER'
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary/50'
                      }`}
                      onClick={() => !loading && handleChange({ target: { name: 'role', value: 'BUYER' } })}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="BUYER"
                        checked={formData.role === 'BUYER'}
                        onChange={handleChange}
                        disabled={loading}
                        className="sr-only"
                      />
                      <ShoppingCart className="h-5 w-5" />
                      <span className="font-medium">Buyer</span>
                    </div>
                    <div
                      className={`relative flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        formData.role === 'SELLER'
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary/50'
                      }`}
                      onClick={() => !loading && handleChange({ target: { name: 'role', value: 'SELLER' } })}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="SELLER"
                        checked={formData.role === 'SELLER'}
                        onChange={handleChange}
                        disabled={loading}
                        className="sr-only"
                      />
                      <Store className="h-5 w-5" />
                      <span className="font-medium">Seller</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>

            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
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
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md flex items-center gap-2">
                <span>✓</span> {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                isRegisterMode ? 'Sign Up' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              </span>
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:underline font-medium"
                disabled={loading}
              >
                {isRegisterMode ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            {!isRegisterMode && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Need a quick test account?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={fillDemo}
                    disabled={loading}
                    size="sm"
                  >
                    Use Demo Account
                  </Button>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <code className="bg-muted px-2 py-1 rounded">demo_user</code>
                    <span className="mx-1">/</span>
                    <code className="bg-muted px-2 py-1 rounded">demo_pass</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
