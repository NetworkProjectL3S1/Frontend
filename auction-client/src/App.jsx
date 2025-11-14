import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2, LogOut, User as UserIcon, ChevronDown, ShoppingCart, Store } from 'lucide-react';
import LoginForm from './components/LoginForm';
import AuctionList from './components/AuctionList';
import UserProfile from './components/UserProfile';
import { Badge } from './components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [currentView, setCurrentView] = useState('auctions'); // 'auctions' or 'profile'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setCurrentView('profile');
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const getRoleIcon = () => {
    if (user?.role === 'BUYER') return <ShoppingCart className="h-3 w-3" />;
    if (user?.role === 'SELLER') return <Store className="h-3 w-3" />;
    return null;
  };

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
        <div className="container mx-auto flex h-16 items-center justify-between px-6 md:px-8 lg:px-12">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setCurrentView('auctions')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
              AH
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Auction House
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <div ref={dropdownRef}>
                <DropdownMenuTrigger
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white cursor-pointer hover:shadow-lg transition-shadow">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  {/* User Info */}
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-slate-900">
                      {user?.username || 'User'}
                    </span>
                    {user?.role && (
                      <Badge variant="secondary" className="mt-0.5 text-xs flex items-center gap-1">
                        {getRoleIcon()}
                        {user.role === 'BUYER' ? 'Buyer' : user.role === 'SELLER' ? 'Seller' : user.role}
                      </Badge>
                    )}
                  </div>
                  
                  <ChevronDown className={`h-4 w-4 text-slate-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </DropdownMenuTrigger>

                {dropdownOpen && (
                  <DropdownMenuContent align="end" className="w-56">
                    {/* User Info in Dropdown (mobile) */}
                    <div className="px-2 py-2 md:hidden">
                      <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
                      <p className="text-xs text-slate-500">{user?.email || 'No email'}</p>
                    </div>
                    <div className="md:hidden">
                      <DropdownMenuSeparator />
                    </div>

                    {/* My Profile */}
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <UserIcon className="mr-2 h-4 w-4 text-slate-600" />
                      <span className="font-medium">My Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="font-medium">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                )}
              </div>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        {currentView === 'auctions' ? <AuctionList /> : <UserProfile />}
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
