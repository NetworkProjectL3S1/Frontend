import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import auctionChatService from '../utils/auctionChatService';

const API_BASE = 'http://localhost:8081/api';

export default function ChatBox({ auctionId, sellerId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from database on mount
  useEffect(() => {
    const loadMessages = async () => {
      if (!auctionId) return;
      
      try {
        const res = await fetch(`${API_BASE}/chat/messages?auctionId=${auctionId}`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
          console.log('[ChatBox] Loaded', data.data.length, 'messages from database');
          
          // Transform database messages to match WebSocket format
          const dbMessages = data.data.map(msg => ({
            username: msg.senderUsername,
            senderUsername: msg.senderUsername,
            recipientUsername: msg.recipientUsername,
            content: msg.content,
            timestamp: msg.timestamp,
            isOwnMessage: msg.senderUsername === user?.username,
            fromDatabase: true
          }));
          
          setMessages(dbMessages);
        }
      } catch (error) {
        console.error('[ChatBox] Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [auctionId, user]);

  // Connect to chat server when component mounts
  useEffect(() => {
    if (!user?.username || !sellerId) return;

    const connectToChat = async () => {
      setIsConnecting(true);
      try {
        await auctionChatService.connect(user.username);
        setIsConnected(true);
      } catch (error) {
        console.error('[ChatBox] Failed to connect to chat:', error);
        setIsConnected(false);
      } finally {
        setIsConnecting(false);
      }
    };

    connectToChat();

    // Subscribe to connection changes
    const unsubscribeConnection = auctionChatService.onConnectionChange(setIsConnected);

    // Subscribe to messages for this auction
    const unsubscribeMessages = auctionChatService.subscribeToAuction(auctionId, (message) => {
      console.log('[ChatBox] Received WebSocket message:', message);
      console.log('[ChatBox] Current user:', user?.username);
      console.log('[ChatBox] Message sender:', message.username || message.senderUsername);
      
      // Create unique message ID based on sender, content, and approximate timestamp
      const messageSender = message.username || message.senderUsername;
      const messageId = `${messageSender}_${message.content}_${Math.floor(message.timestamp / 1000)}`;
      
      console.log('[ChatBox] Message ID:', messageId);
      
      // Check and update both messages and IDs atomically
      setMessages(prev => {
        console.log('[ChatBox] Current messages count:', prev.length);
        
        // Check if this message already exists
        const existingIds = new Set();
        prev.forEach(m => {
          const sender = m.username || m.senderUsername;
          const id = `${sender}_${m.content}_${Math.floor(m.timestamp / 1000)}`;
          existingIds.add(id);
        });
        
        console.log('[ChatBox] Existing message IDs:', Array.from(existingIds));
        
        if (existingIds.has(messageId)) {
          console.log('[ChatBox] ❌ Skipping duplicate message with ID:', messageId);
          return prev;
        }
        
        console.log('[ChatBox] ✅ Adding new message from', messageSender);
        return [...prev, {
          ...message,
          username: messageSender,
          senderUsername: messageSender,
          isOwnMessage: messageSender === user?.username
        }];
      });
    });

    return () => {
      unsubscribeConnection();
      unsubscribeMessages();
    };
  }, [user, auctionId, sellerId]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected || !sellerId) return;

    // Buyer always sends to seller
    const recipient = sellerId;

    // Send private message
    console.log('[ChatBox] Sending to:', recipient, 'Message:', inputMessage.trim());
    const sent = auctionChatService.sendPrivateMessage(recipient, inputMessage.trim(), auctionId);
    
    if (sent) {
      setInputMessage('');
    } else {
      console.error('[ChatBox] Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Chat with Seller</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please login to chat with the seller</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {user.role === 'SELLER' && user.username === sellerId ? 'Buyer' : 'Seller'}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto mb-4 p-3 bg-slate-50 rounded-lg border">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => {
                const isOwnMessage = msg.username === user.username || msg.senderUsername === user.username;
                return (
                  <div key={idx} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-2 ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-white border'
                    }`}>
                      {!isOwnMessage && (
                        <p className="text-xs font-semibold mb-1">{msg.username || msg.senderUsername}</p>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder={isConnected ? "Type your message..." : "Connecting to chat..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected || isConnecting}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!isConnected || !inputMessage.trim() || isConnecting}
            size="icon"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!isConnected && !isConnecting && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Chat server not connected. Make sure the chat server is running on port 8080.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

