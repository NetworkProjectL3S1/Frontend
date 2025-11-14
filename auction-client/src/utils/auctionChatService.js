import { useState, useEffect, useRef } from 'react';

/**
 * Chat service for auction-specific buyer-seller communication
 * Integrates with existing WebSocket chat server on port 8080
 */
class AuctionChatService {
  constructor() {
    this.socket = null;
    this.username = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.connectionListeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastMessageKey = null; // Track last message to prevent duplicates
  }

  /**
   * Connect to chat server
   */
  connect(username) {
    if (this.isConnected && this.username === username) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.username = username;
        this.socket = new WebSocket('ws://localhost:8080/chat');

        this.socket.onopen = () => {
          console.log('[AuctionChat] Connected to chat server');
          // Send username to server
          this.socket.send(username);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyConnectionListeners(true);
          resolve();
        };

        this.socket.onmessage = (event) => {
          console.log('[AuctionChat] 📨 WebSocket raw message received:', event.data);
          console.log('[AuctionChat] Connected as:', this.username);
          this.handleMessage(event.data);
        };

        this.socket.onclose = () => {
          console.log('[AuctionChat] Disconnected from chat server');
          this.isConnected = false;
          this.notifyConnectionListeners(false);
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('[AuctionChat] WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from chat server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.username = null;
    }
  }

  /**
   * Send a private message to another user with auction context
   */
  sendPrivateMessage(recipientUsername, messageContent, auctionId) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[AuctionChat] Cannot send message: WebSocket not connected');
      console.error('[AuctionChat] Socket state:', this.socket?.readyState);
      return false;
    }

    const message = `/msg ${recipientUsername} [Auction:${auctionId}] ${messageContent}`;
    console.log('[AuctionChat] 📤 Sending private message:', message);
    console.log('[AuctionChat] From:', this.username, 'To:', recipientUsername, 'Auction:', auctionId);
    
    this.socket.send(message);
    return true;
  }

  /**
   * Subscribe to messages for a specific auction
   */
  subscribeToAuction(auctionId, callback) {
    console.log('[AuctionChat] 📌 Subscribing to auction:', auctionId);
    console.log('[AuctionChat] Current subscriptions before:', Array.from(this.messageHandlers.keys()));
    
    if (!this.messageHandlers.has(auctionId)) {
      this.messageHandlers.set(auctionId, []);
    }
    this.messageHandlers.get(auctionId).push(callback);
    
    console.log('[AuctionChat] Current subscriptions after:', Array.from(this.messageHandlers.keys()));
    console.log('[AuctionChat] Handler count for', auctionId, ':', this.messageHandlers.get(auctionId).length);

    // Return unsubscribe function
    return () => {
      console.log('[AuctionChat] 🔓 Unsubscribing from auction:', auctionId);
      const handlers = this.messageHandlers.get(auctionId);
      if (handlers) {
        const index = handlers.indexOf(callback);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        console.log('[AuctionChat] Remaining handlers for', auctionId, ':', handlers.length);
      }
    };
  }

  /**
   * Listen for connection status changes
   */
  onConnectionChange(callback) {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    try {
      console.log('[AuctionChat] Raw received:', data);
      console.log('[AuctionChat] Current username:', this.username);
      console.log('[AuctionChat] Registered handlers for auctions:', Array.from(this.messageHandlers.keys()));
      
      // Skip system messages and non-private messages for auction chat
      if (!data.includes('[Private') || !data.includes('[Auction:')) {
        console.log('[AuctionChat] Skipping non-auction message');
        return;
      }
      
      let username = null;
      let content = data;
      let auctionId = null;
      let isOwnMessage = false;

      // Format 1: [Private from username] [Auction:ID] message
      const privateFromMatch = data.match(/\[Private from ([^\]]+)\] \[Auction:([^\]]+)\] (.+)/);
      if (privateFromMatch) {
        username = privateFromMatch[1];
        auctionId = privateFromMatch[2];
        content = privateFromMatch[3];
        isOwnMessage = false;
        console.log('[AuctionChat] Parsed [Private from]:', { username, auctionId, content });
      } else {
        // Format 2: [Private to username] [Auction:ID] message (echo of sent message)
        const privateToMatch = data.match(/\[Private to ([^\]]+)\] \[Auction:([^\]]+)\] (.+)/);
        if (privateToMatch) {
          username = this.username; // Own message
          auctionId = privateToMatch[2];
          content = privateToMatch[3];
          isOwnMessage = true;
          console.log('[AuctionChat] Parsed [Private to]:', { username, auctionId, content });
        }
      }

      // Only dispatch if we found auction ID
      if (auctionId) {
        if (this.messageHandlers.has(auctionId)) {
          const handlers = this.messageHandlers.get(auctionId);
          const messageObj = {
            username,
            content,
            auctionId,
            timestamp: Date.now(),
            isOwnMessage,
            raw: data
          };
          console.log('[AuctionChat] ✅ Dispatching to', handlers.length, 'handler(s) for auction', auctionId, ':', messageObj);
          
          handlers.forEach(callback => callback(messageObj));
        } else {
          console.log('[AuctionChat] ❌ No handlers for auction:', auctionId);
          console.log('[AuctionChat] Available auction handlers:', Array.from(this.messageHandlers.keys()));
          console.log('[AuctionChat] Message details:', { username, content, auctionId, isOwnMessage });
        }
      } else {
        console.log('[AuctionChat] ❌ Could not extract auction ID from message:', data);
      }

    } catch (error) {
      console.error('[AuctionChat] Error handling message:', error);
    }
  }

  /**
   * Notify connection listeners
   */
  notifyConnectionListeners(isConnected) {
    this.connectionListeners.forEach(callback => callback(isConnected));
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[AuctionChat] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[AuctionChat] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.username && !this.isConnected) {
        this.connect(this.username).catch(err => {
          console.error('[AuctionChat] Reconnect failed:', err);
        });
      }
    }, 3000 * this.reconnectAttempts); // Exponential backoff
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      username: this.username
    };
  }
}

// Singleton instance
const auctionChatService = new AuctionChatService();

export default auctionChatService;
