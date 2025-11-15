// WebSocket service for real-time bid updates
class BidWebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Map(); // auctionId -> Set of callbacks
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = false;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Connect to WebSocket server (using simple EventSource as fallback for HTTP polling)
      // Since we're using basic HTTP server, we'll use polling instead
      console.log('[BidWebSocket] Initializing connection...');
      this.isConnecting = false;
      
      // For now, we'll use HTTP polling instead of WebSocket
      // This can be upgraded to proper WebSocket when available
      this.startPolling();
    } catch (error) {
      console.error('[BidWebSocket] Connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  startPolling() {
    // Poll for updates every 2 seconds for subscribed auctions
    this.pollingInterval = setInterval(() => {
      this.subscribers.forEach((callbacks, auctionId) => {
        this.pollAuctionUpdates(auctionId);
      });
    }, 2000);
  }

  async pollAuctionUpdates(auctionId) {
    try {
      const response = await fetch(`http://localhost:8081/api/bids/history?auctionId=${auctionId}`);
      const data = await response.json();
      
      if (data.success && data.data?.length > 0) {
        // Get the most recent bid
        const latestBid = data.data[0];
        
        // Notify all subscribers for this auction
        const callbacks = this.subscribers.get(auctionId);
        if (callbacks) {
          callbacks.forEach(callback => {
            callback({
              type: 'BID_UPDATE',
              auctionId,
              bid: latestBid
            });
          });
        }
      }
    } catch (error) {
      console.error('[BidWebSocket] Polling error:', error);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[BidWebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('[BidWebSocket] Max reconnection attempts reached');
    }
  }

  subscribe(auctionId, callback) {
    if (!this.subscribers.has(auctionId)) {
      this.subscribers.set(auctionId, new Set());
    }
    this.subscribers.get(auctionId).add(callback);
    
    console.log(`[BidWebSocket] Subscribed to auction: ${auctionId}`);
    
    // Start polling if not already started
    if (!this.pollingInterval) {
      this.startPolling();
    }
    
    return () => this.unsubscribe(auctionId, callback);
  }

  unsubscribe(auctionId, callback) {
    const callbacks = this.subscribers.get(auctionId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(auctionId);
      }
    }
    
    console.log(`[BidWebSocket] Unsubscribed from auction: ${auctionId}`);
    
    // Stop polling if no more subscribers
    if (this.subscribers.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscribers.clear();
    console.log('[BidWebSocket] Disconnected');
  }
}

// Export singleton instance
export const bidWebSocket = new BidWebSocketService();
