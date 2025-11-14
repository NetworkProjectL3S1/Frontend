import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Clock, User, DollarSign, TrendingUp, Trophy, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BidPanel from '../components/BidPanel';
import ChatBox from '../components/ChatBox';
import AuctionProgressBar from '../components/AuctionProgressBar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { bidWebSocket } from '../utils/bidWebSocket';

const API_BASE = 'http://localhost:8081/api';

// Format milliseconds to human-readable time
const formatTimeRemaining = (ms) => {
  if (ms <= 0) return 'EXPIRED';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export default function AuctionPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastBidUpdate, setLastBidUpdate] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showWinnerNotification, setShowWinnerNotification] = useState(false);
  const [showSellerNotification, setShowSellerNotification] = useState(false);

  // Fetch auction details
  const fetchAuction = async () => {
    try {
      const res = await fetch(`${API_BASE}/auctions/${auctionId}`);
      const data = await res.json();
      if (data.success) {
        setAuction(data.data);
      } else {
        setError(data.error || 'Failed to load auction');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch bid history
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bids/history?auctionId=${encodeURIComponent(auctionId)}`);
      const data = await res.json();
      if (data.success) setHistory(data.data || []);
      else setError(data.error || 'Failed to load history');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (auctionId) {
      fetchAuction();
      fetchHistory();
    }
  }, [auctionId]);

  // Timer countdown
  useEffect(() => {
    if (!auction || !auction.endTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = auction.endTime - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
      } else {
        setTimeRemaining(remaining);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  // Subscribe to real-time bid updates and expiration notifications
  useEffect(() => {
    if (!auctionId) return;

    const handleBidUpdate = (data) => {
      console.log('[AuctionPage] Received update:', data);
      
      if (data.type === 'BID_UPDATE' && data.auctionId === auctionId) {
        setLastBidUpdate(data.bid);
        
        // Update auction with new highest bid
        setAuction(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            currentHighestBid: data.bid.amount || prev.currentHighestBid,
            currentHighestBidder: data.bid.userId || prev.currentHighestBidder,
          };
        });
        
        // Refresh history to show new bid
        fetchHistory();
      } else if (data.type === 'AUCTION_EXPIRED' && data.auctionId === auctionId) {
        // Handle auction expiration notification
        setIsExpired(true);
        setAuction(prev => ({
          ...prev,
          status: 'CLOSED',
          currentHighestBid: data.finalPrice,
          currentHighestBidder: data.winner
        }));
        
        // Show notification if user is winner or seller
        if (user && data.winner === user.username) {
          setShowWinnerNotification(true);
        } else if (user && data.seller === user.username) {
          setShowSellerNotification(true);
        }
      }
    };

    // Subscribe to bid updates for this auction
    const unsubscribe = bidWebSocket.subscribe(auctionId, handleBidUpdate);

    return () => {
      unsubscribe();
    };
  }, [auctionId, user]);

  const handleRefresh = () => {
    fetchAuction();
    fetchHistory();
  };

  if (loading && !auction) {
    return (
      <div className="container mx-auto py-10 px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-4 text-muted-foreground">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="container mx-auto py-10 px-6 md:px-8 lg:px-12">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Auctions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-6 md:px-8 lg:px-12">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Auctions
      </Button>

      {/* Winner Notification */}
      {showWinnerNotification && (
        <Card className="mb-6 border-green-600 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <Trophy className="h-6 w-6" />
                <span className="font-bold text-lg">
                  Congratulations! You won the auction for ${Number(auction?.currentHighestBid).toFixed(2)}!
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowWinnerNotification(false)}>×</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seller Notification */}
      {showSellerNotification && (
        <Card className="mb-6 border-blue-600 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-6 w-6" />
                <span className="font-bold text-lg">
                  Your auction "{auction?.itemName}" has ended! {auction?.currentHighestBidder ? `Winner: ${auction.currentHighestBidder} ($${Number(auction.currentHighestBid).toFixed(2)})` : 'No bids received.'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSellerNotification(false)}>×</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Update Indicator */}
      {lastBidUpdate && !isExpired && (
        <Card className="mb-6 border-green-500 bg-green-50 animate-pulse">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">
                New bid: ${Number(lastBidUpdate.amount).toFixed(2)} by {lastBidUpdate.userId}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Indicator */}
      {isExpired && (
        <Card className="mb-6 border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold">
                This auction has expired. No more bids can be placed.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{auction?.itemName}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent">
                  {auction?.category || 'General'}
                </Badge>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Seller: <span className="font-semibold">{auction?.sellerId}</span>
                </span>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-8 px-6 pb-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="border-2">
                <CardHeader className="bg-slate-50">
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground">
                    {auction?.itemDescription || 'No description provided'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Starting Price</p>
                        <p className="text-lg font-bold">${Number(auction?.basePrice || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Current Bid</p>
                        <p className="text-lg font-bold text-primary">
                          ${Number(auction?.currentHighestBid || auction?.basePrice || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className={`h-5 w-5 ${isExpired ? 'text-red-500' : 'text-primary'}`} />
                      <span className="font-semibold text-lg">
                        {isExpired ? 'Auction Ended' : 'Time Remaining: ' + (timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Loading...')}
                      </span>
                    </div>
                    {!isExpired && auction?.duration && (
                      <AuctionProgressBar 
                        timeRemaining={timeRemaining || 0} 
                        duration={auction.duration}
                      />
                    )}
                    {isExpired && (
                      <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden border border-red-300">
                        <div className="h-full bg-red-500 w-0" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="bg-slate-50">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Bid History</span>
                    <Badge variant="outline">{history.length} bids</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {loading && history.length === 0 && (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  {!loading && history.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">No bids yet. Be the first!</p>
                  )}
                  {history.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {history.map((b, i) => (
                        <div 
                          key={i} 
                          className={`flex items-center justify-between py-3 px-3 border-2 rounded-lg hover:bg-slate-50 transition-colors ${
                            lastBidUpdate && b.amount === lastBidUpdate.amount && b.userId === lastBidUpdate.userId
                              ? 'border-green-500 bg-green-50'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{b.userId}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary text-lg">${Number(b.amount).toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(b.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <BidPanel 
                auctionId={auction?.auctionId} 
                currentHighest={auction?.currentHighestBid || auction?.basePrice} 
                onBidded={handleRefresh}
                disabled={isExpired}
              />
              <ChatBox auctionId={auction?.auctionId} sellerId={auction?.sellerId} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
