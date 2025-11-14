import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, ShoppingCart, Store, Edit2, Save, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

export default function UserProfile() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (formData.email && !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return false;
      }
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      const updateData = {
        email: formData.email,
      };

      // Include password change if requested
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local user state
        const updatedUser = {
          ...user,
          email: formData.email,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setFormData({
          email: formData.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'BUYER') return <ShoppingCart className="h-5 w-5" />;
    if (role === 'SELLER') return <Store className="h-5 w-5" />;
    return <User className="h-5 w-5" />;
  };

  const getRoleBadgeVariant = (role) => {
    if (role === 'SELLER') return 'default';
    return 'secondary';
  };

  return (
    <div className="container mx-auto py-10 px-6 md:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 mt-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
            <p className="text-muted-foreground mt-1">Manage your account settings</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">{success}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-2xl">{user?.username}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Badge variant={getRoleBadgeVariant(user?.role)} className="flex items-center gap-1">
                      {getRoleIcon(user?.role)}
                      <span>{user?.role === 'BUYER' ? 'Buyer' : user?.role === 'SELLER' ? 'Seller' : user?.role}</span>
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-8 px-6 pb-8">
            <div className="space-y-6">
              {/* Username (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <p className="font-medium text-slate-700">{user?.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    disabled={isSaving}
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                    <p className="font-medium text-slate-700">{user?.email || 'No email provided'}</p>
                  </div>
                )}
              </div>

              {/* Role (Read-only) */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  {getRoleIcon(user?.role)}
                  Account Type
                </Label>
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <p className="font-medium text-slate-700">
                    {user?.role === 'BUYER' ? 'Buyer Account' : user?.role === 'SELLER' ? 'Seller Account' : user?.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.role === 'BUYER' 
                      ? 'You can bid on auctions and purchase items' 
                      : 'You can create auctions and sell items'}
                  </p>
                </div>
              </div>

              {/* Password Change (Only in edit mode) */}
              {isEditing && (
                <div className="border-t-2 pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Leave password fields empty if you don't want to change your password
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password (min 6 characters)"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t-2">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={isSaving} className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Account Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Bids</span>
                  <span className="font-bold text-lg">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Active Auctions</span>
                  <span className="font-bold text-lg">-</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Account Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium text-sm">Recently</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
