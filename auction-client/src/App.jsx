import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import AuctionList from './components/AuctionList';
import './App.css';

function AppContent() {
  const { isAuthenticated, user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🏛️ Real-Time Auction</h1>
          <div className="user-section">
            <div className="user-info">
              <span className="welcome-text">
                Welcome, <strong>{user?.username || 'User'}</strong>!
              </span>
              {user?.role && (
                <span className="user-role">
                  {user.role === 'BUYER' ? '🛒 Buyer' : user.role === 'SELLER' ? '🏪 Seller' : user.role}
                </span>
              )}
            </div>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
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
