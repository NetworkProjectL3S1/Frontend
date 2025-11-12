import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2, LogOut } from 'lucide-react';
import LoginForm from './components/LoginForm';
import AuctionList from './components/AuctionList';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
              AH
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Auction House
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">
                Welcome, <strong>{user?.username || 'User'}</strong>
              </span>
              {user?.role && (
                <Badge variant="secondary" className="mt-1">
                  {user.role === 'BUYER' ? 'Buyer' : user.role === 'SELLER' ? 'Seller' : user.role}
                </Badge>
              )}
            </div>
            <Button onClick={logout} variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <AuctionList />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
