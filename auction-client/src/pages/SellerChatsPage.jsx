import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Clock, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import auctionChatService from '../utils/auctionChatService';

const API_BASE = 'http://localhost:8081/api';

export default function SellerChatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [auctionBuyers, setAuctionBuyers] = useState({});

  // Fetch seller's auctions
  useEffect(() => {
    if (!user || user.role !== 'SELLER') {
      navigate('/');
      return;
    }

    fetchSellerAuctions();
  }, [user, navigate]);

  // Load chat messages and buyers from database for all auctions
  useEffect(() => {
    if (!auctions.length) return;

    const loadAllMessages = async () => {
      const messagesMap = {};
      const buyersMap = {};
      
      for (const auction of auctions) {
        try {
          // Load messages
          const res = await fetch(`${API_BASE}/chat/messages?auctionId=${auction.auctionId}`);
          const data = await res.json();
          
          if (data.success && Array.isArray(data.data)) {
            const messages = data.data.map(msg => ({
              username: msg.senderUsername,
              senderUsername: msg.senderUsername,
              content: msg.content,
              timestamp: msg.timestamp,
              isOwnMessage: msg.senderUsername === user?.username,
              fromDatabase: true
            }));
            messagesMap[auction.auctionId] = messages;
            
            // Extract unique buyers from messages
            const buyers = [...new Set(
              messages
                .filter(m => !m.isOwnMessage)
                .map(m => m.senderUsername)
            )];
            
            // If no buyers in messages but auction has highest bidder, use that
            if (buyers.length === 0 && auction.currentHighestBidder && auction.currentHighestBidder !== 'None') {
              buyers.push(auction.currentHighestBidder);
            }
            
            buyersMap[auction.auctionId] = buyers;
          }
        } catch (error) {
          console.error(`Failed to load messages for auction ${auction.auctionId}:`, error);
        }
      }
      
      setChatMessages(messagesMap);
      setAuctionBuyers(buyersMap);
    };

    loadAllMessages();
  }, [auctions, user]);

  // Connect to chat server
  useEffect(() => {
    if (!user?.username) return;

    const connectToChat = async () => {
      try {
        await auctionChatService.connect(user.username);
        setIsConnected(true);
      } catch (error) {
        console.error('[SellerChats] Failed to connect to chat:', error);
      }
    };

    connectToChat();

    const unsubscribe = auctionChatService.onConnectionChange(setIsConnected);
    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages for all seller's auctions
  useEffect(() => {
    if (!auctions.length || !isConnected) return;

    const unsubscribers = [];

    auctions.forEach(auction => {
      const unsubscribe = auctionChatService.subscribeToAuction(auction.auctionId, (message) => {
        console.log('[SellerChats] 📨 New WebSocket message for auction', auction.auctionId);
        console.log('[SellerChats] Message details:', message);
        console.log('[SellerChats] Message sender:', message.username || message.senderUsername);
        console.log('[SellerChats] Current seller:', user?.username);
        
        setChatMessages(prev => {
          const existingMessages = prev[auction.auctionId] || [];
          
          // Check for duplicates using normalized timestamp (to second precision)
          const messageSender = message.username || message.senderUsername;
          const messageId = `${messageSender}_${message.content}_${Math.floor(message.timestamp / 1000)}`;
          
          console.log('[SellerChats] Creating message ID:', messageId);
          console.log('[SellerChats] Existing messages count:', existingMessages.length);
          
          const isDuplicate = existingMessages.some(m => {
            const sender = m.username || m.senderUsername;
            const existingId = `${sender}_${m.content}_${Math.floor(m.timestamp / 1000)}`;
            return existingId === messageId;
          });
          
          if (isDuplicate) {
            console.log('[SellerChats] ❌ Skipping duplicate message');
            return prev;
          }
          
          console.log('[SellerChats] ✅ Adding new message from', messageSender);
          return {
            ...prev,
            [auction.auctionId]: [...existingMessages, {
              ...message,
              username: messageSender,
              senderUsername: messageSender
            }]
          };
        });
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [auctions, isConnected]);

  const fetchSellerAuctions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auctions/seller?sellerId=${user.username}`);
      const data = await res.json();
      if (data.success) {
        setAuctions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = (auctionId) => {
    const messages = chatMessages[auctionId] || [];
    return messages.filter(msg => msg.username !== user.username && !msg.isRead).length;
  };

  const openAuctionChat = (auction) => {
    setSelectedAuction(auction);
    // Mark messages as read
    setChatMessages(prev => ({
      ...prev,
      [auction.auctionId]: (prev[auction.auctionId] || []).map(msg => ({
        ...msg,
        isRead: true
      }))
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-6">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-6 md:px-8 lg:px-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Chat Dashboard</h1>
        <p className="text-muted-foreground">
          View and respond to buyer messages for your auctions
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{isConnected ? 'Connected to chat' : 'Disconnected'}</span>
        </div>
      </div>

      {selectedAuction ? (
        <div>
          <Button variant="outline" onClick={() => setSelectedAuction(null)} className="mb-4">
            ← Back to Chats
          </Button>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-2">
              <CardHeader className="bg-slate-50">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat Messages
                </CardTitle>
                <CardDescription>{selectedAuction.itemName}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-96 overflow-y-auto mb-4 p-3 bg-slate-50 rounded-lg border">
                  {(!chatMessages[selectedAuction.auctionId] || chatMessages[selectedAuction.auctionId].length === 0) ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages[selectedAuction.auctionId].map((msg, idx) => {
                        const messageSender = msg.username || msg.senderUsername;
                        const isOwnMessage = messageSender === user.username;
                        return (
                          <div key={idx} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              isOwnMessage 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-white border-2'
                            }`}>
                              {!isOwnMessage && (
                                <p className="text-xs font-bold mb-1">Buyer: {messageSender}</p>
                              )}
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    id="seller-reply-input"
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border rounded-lg"
                    disabled={!isConnected}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        // Get buyer username from auction buyers list or highest bidder
                        const buyers = auctionBuyers[selectedAuction.auctionId] || [];
                        let buyerUsername = buyers[0]; // Use first buyer in list
                        
                        // Fallback to highest bidder if no buyers in list
                        if (!buyerUsername && selectedAuction.currentHighestBidder && selectedAuction.currentHighestBidder !== 'None') {
                          buyerUsername = selectedAuction.currentHighestBidder;
                        }
                        
                        if (buyerUsername) {
                          console.log('[SellerChats] 📤 Sending message to buyer:', buyerUsername);
                          console.log('[SellerChats] Auction ID:', selectedAuction.auctionId);
                          console.log('[SellerChats] Message:', e.target.value.trim());
                          console.log('[SellerChats] Current seller:', user?.username);
                          
                          const sent = auctionChatService.sendPrivateMessage(
                            buyerUsername,
                            e.target.value.trim(),
                            selectedAuction.auctionId
                          );
                          if (sent) {
                            console.log('[SellerChats] ✅ Message sent successfully');
                            e.target.value = '';
                          } else {
                            console.error('[SellerChats] ❌ Failed to send message');
                          }
                        } else {
                          console.error('[SellerChats] ❌ No buyer username found');
                          console.log('[SellerChats] Buyers list:', buyers);
                          console.log('[SellerChats] Highest bidder:', selectedAuction.currentHighestBidder);
                          alert('No buyer available for this auction yet. Wait for a bid or message.');
                        }
                      }
                    }}
                  />
                  <Button 
                    disabled={!isConnected}
                    onClick={() => {
                      const input = document.getElementById('seller-reply-input');
                      if (input && input.value.trim()) {
                        // Get buyer username from auction buyers list or highest bidder
                        const buyers = auctionBuyers[selectedAuction.auctionId] || [];
                        let buyerUsername = buyers[0]; // Use first buyer in list
                        
                        // Fallback to highest bidder if no buyers in list
                        if (!buyerUsername && selectedAuction.currentHighestBidder && selectedAuction.currentHighestBidder !== 'None') {
                          buyerUsername = selectedAuction.currentHighestBidder;
                        }
                        
                        if (buyerUsername) {
                          console.log('[SellerChats] Button click - 📤 Sending message to buyer:', buyerUsername);
                          console.log('[SellerChats] Auction ID:', selectedAuction.auctionId);
                          console.log('[SellerChats] Message:', input.value.trim());
                          console.log('[SellerChats] Current seller:', user?.username);
                          
                          const sent = auctionChatService.sendPrivateMessage(
                            buyerUsername,
                            input.value.trim(),
                            selectedAuction.auctionId
                          );
                          if (sent) {
                            console.log('[SellerChats] ✅ Message sent successfully');
                            input.value = '';
                          } else {
                            console.error('[SellerChats] ❌ Failed to send message');
                          }
                        } else {
                          console.error('[SellerChats] ❌ No buyer username found');
                          console.log('[SellerChats] Buyers list:', buyers);
                          console.log('[SellerChats] Highest bidder:', selectedAuction.currentHighestBidder);
                          alert('No buyer available for this auction yet. Wait for a bid or message.');
                        }
                      }
                    }}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-lg">Auction Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Item</p>
                  <p className="font-semibold">{selectedAuction.itemName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Bid</p>
                  <p className="text-lg font-bold text-primary">
                    ${Number(selectedAuction.currentHighestBid).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest Bidder</p>
                  <p className="font-semibold">{selectedAuction.currentHighestBidder || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedAuction.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {selectedAuction.status}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/auction/${selectedAuction.auctionId}`)}
                >
                  View Auction Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You don't have any auctions yet</p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Create Your First Auction
              </Button>
            </div>
          ) : (
            auctions.map(auction => {
              const unreadCount = getUnreadCount(auction.auctionId);
              const messageCount = (chatMessages[auction.auctionId] || []).length;

              return (
                <Card 
                  key={auction.auctionId}
                  className="border-2 hover:border-primary cursor-pointer transition-colors"
                  onClick={() => openAuctionChat(auction)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{auction.itemName}</CardTitle>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {messageCount} messages
                      </span>
                      <Badge variant="outline">{auction.status}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Bid:</span>
                        <span className="font-bold text-primary">
                          ${Number(auction.currentHighestBid).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bidder:</span>
                        <span className="font-semibold">
                          {auction.currentHighestBidder || 'None'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        {auction.endTime && new Date(auction.endTime).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
