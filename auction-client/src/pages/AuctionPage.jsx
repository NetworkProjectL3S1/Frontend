import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Clock, User, DollarSign, TrendingUp } from 'lucide-react';
import BidPanel from '../components/BidPanel';
import ChatBox from '../components/ChatBox';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { bidWebSocket } from '../utils/bidWebSocket';

const API_BASE = 'http://localhost:8081/api';

export default function AuctionPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastBidUpdate, setLastBidUpdate] = useState(null);

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

  // Subscribe to real-time bid updates
  useEffect(() => {
    if (!auctionId) return;

    const handleBidUpdate = (data) => {
      console.log('[AuctionPage] Received bid update:', data);
      
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
      }
    };

    // Subscribe to bid updates for this auction
    const unsubscribe = bidWebSocket.subscribe(auctionId, handleBidUpdate);

    return () => {
      unsubscribe();
    };
  }, [auctionId]);

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

      {/* Real-time Update Indicator */}
      {lastBidUpdate && (
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
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ends At</p>
                        <p className="text-sm font-medium">
                          {auction?.endTime ? new Date(auction.endTime).toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                      <Badge variant={auction?.status === 'ACTIVE' ? 'default' : 'secondary'} className="font-semibold">
                        {auction?.status}
                      </Badge>
                    </div>
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
              />
              <ChatBox auctionId={auction?.auctionId} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
