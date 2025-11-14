# Real-Time Bidding System Setup

## Overview
This document explains the real-time bid broadcasting system implemented using React Router and WebSocket polling.

## Architecture

### Backend Components

#### 1. WebSocketBidController.java
**Location**: `Backend-1/src/main/api/controllers/WebSocketBidController.java`

**Purpose**: Manages real-time bid broadcasting to all connected clients watching specific auctions.

**Key Features**:
- Maintains a map of auction subscribers (`ConcurrentHashMap<String, Set<WebSocketConnection>>`)
- Broadcasts bid updates in JSON format to all subscribers of a specific auction
- Handles connection lifecycle (subscribe/unsubscribe)
- Thread-safe for concurrent access

**Broadcast Format**:
```json
{
  "type": "BID_UPDATE",
  "auctionId": "auction-123",
  "bid": {
    "userId": "user1",
    "amount": 150.00,
    "timestamp": 1234567890
  },
  "currentHighestBid": 150.00
}
```

#### 2. BidController.java (Modified)
**Changes**: Added broadcast call after successful bid placement

```java
// After updating auction with new bid
WebSocketBidController.broadcastBid(auction.getAuctionId(), bid, auction);
```

### Frontend Components

#### 1. bidWebSocket.js
**Location**: `Frontend-1/auction-client/src/utils/bidWebSocket.js`

**Purpose**: Manages WebSocket-like connections using HTTP polling (fallback for simple HTTP server)

**Key Features**:
- Singleton service pattern
- Subscription-based architecture (subscribe to specific auction IDs)
- Automatic polling every 2 seconds for subscribed auctions
- Callback-based notifications for bid updates
- Automatic cleanup when no subscribers remain

**Usage**:
```javascript
import { bidWebSocket } from '../utils/bidWebSocket';

// Subscribe to auction updates
const unsubscribe = bidWebSocket.subscribe(auctionId, (data) => {
  console.log('New bid:', data);
  // Update UI with new bid data
});

// Clean up on unmount
return () => unsubscribe();
```

#### 2. AuctionPage.jsx
**Location**: `Frontend-1/auction-client/src/pages/AuctionPage.jsx`

**Purpose**: Dedicated page for viewing single auction with real-time bid updates

**Key Features**:
- React Router integration (`/auction/:auctionId`)
- Real-time bid subscription using `bidWebSocket`
- Visual feedback for new bids (green highlight + animation)
- Auto-refresh bid history when new bids arrive
- Displays auction details, bid panel, and chat box
- "Back to Auctions" navigation button

**Real-time Updates**:
- Subscribes to auction updates on mount
- Updates auction state when new bid received
- Highlights newest bid in history
- Shows animated notification banner for new bids
- Automatically refreshes bid history

#### 3. AuctionList.jsx (Modified)
**Changes**: 
- Removed embedded `AuctionDetails` component
- Added React Router navigation to auction pages
- Click on auction card navigates to `/auction/:auctionId`
- "View Details" button for explicit navigation

#### 4. App.jsx (Modified)
**Changes**:
- Wrapped app with `BrowserRouter`
- Replaced view state with React Router `Routes`
- Navigation using `useNavigate` hook
- Three routes:
  - `/` - Auction list
  - `/auction/:auctionId` - Auction details page
  - `/profile` - User profile

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `AuctionList` | Browse all auctions |
| `/auction/:auctionId` | `AuctionPage` | View single auction with real-time updates |
| `/profile` | `UserProfile` | User profile management |

## How Real-Time Bidding Works

### Flow Diagram
```
User A places bid
     ↓
BidController receives bid
     ↓
Save bid to database
     ↓
Update auction highest bid
     ↓
WebSocketBidController.broadcastBid()
     ↓
[Backend polls for updates every 2s]
     ↓
Frontend bidWebSocket service detects new bid
     ↓
Callback notifies AuctionPage component
     ↓
UI updates automatically:
  - Auction highest bid updated
  - Bid history refreshed
  - Visual notification shown
     ↓
User B sees update in real-time
```

### Backend Broadcasting
1. User places bid via `/api/bids/place` endpoint
2. `BidController` saves bid to database
3. `BidController` updates auction with new highest bid
4. `BidController` calls `WebSocketBidController.broadcastBid()`
5. Broadcast sends JSON update to all subscribers

### Frontend Polling
1. `AuctionPage` component mounts
2. Subscribes to auction updates via `bidWebSocket.subscribe(auctionId, callback)`
3. Service polls `/api/bids/history?auctionId=X` every 2 seconds
4. When new bid detected, calls all registered callbacks
5. Component updates state with new bid data
6. UI re-renders with updated information

## Testing Real-Time Updates

### Steps to Test
1. **Start Backend Server**:
   ```bash
   cd Backend-1
   ./start-api-server.sh
   ```

2. **Start Frontend Dev Server**:
   ```bash
   cd Frontend-1/auction-client
   npm run dev
   ```
   - Server running on http://localhost:5174

3. **Open Multiple Browser Windows**:
   - Window 1: http://localhost:5174
   - Window 2: http://localhost:5174 (incognito or different browser)

4. **Test Scenario**:
   - Login with different users in each window
   - Navigate to same auction in both windows
   - Place bid in Window 1
   - Observe real-time update in Window 2 (within 2 seconds)

### Expected Behavior
- ✅ New bid appears in bid history without manual refresh
- ✅ Auction highest bid updates automatically
- ✅ Green notification banner shows new bid
- ✅ Newest bid highlighted in bid history
- ✅ Updates happen within 2 seconds (polling interval)

## Configuration

### Polling Interval
Located in `bidWebSocket.js`:
```javascript
this.pollingInterval = setInterval(() => {
  // Poll for updates
}, 2000); // 2 seconds - adjust as needed
```

### API Endpoints
Located in `bidWebSocket.js` and `AuctionPage.jsx`:
```javascript
const API_BASE = 'http://localhost:8081/api';
```

## Future Improvements

### Upgrade to True WebSocket
Current implementation uses HTTP polling. For better performance:

1. **Backend**: Implement proper WebSocket server
   - Use Java WebSocket API (`javax.websocket.*`)
   - Or integrate library like Jetty WebSocket

2. **Frontend**: Replace polling with WebSocket connection
   ```javascript
   const ws = new WebSocket('ws://localhost:8081/ws');
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     // Handle real-time update
   };
   ```

### Other Enhancements
- **Reconnection Logic**: Auto-reconnect on connection loss
- **Heartbeat**: Keep connections alive with ping/pong
- **Message Queue**: Batch updates for better performance
- **Error Handling**: Graceful degradation if real-time fails
- **Loading States**: Show connection status to users
- **Optimistic Updates**: Update UI before server confirms

## Troubleshooting

### Issue: Updates Not Appearing
**Check**:
1. Backend server running on port 8081
2. Frontend can reach `http://localhost:8081/api`
3. Console shows polling requests (check Network tab)
4. Bid successfully saved to database
5. `WebSocketBidController.broadcastBid()` called in `BidController`

### Issue: Slow Updates
**Check**:
1. Polling interval (default 2 seconds)
2. Network latency
3. Database query performance
4. Number of concurrent subscribers

### Issue: Memory Leaks
**Check**:
1. Unsubscribe callbacks called on component unmount
2. Polling intervals cleared when no subscribers
3. WebSocket connections properly closed

## Development Notes

### Dependencies Added
```json
{
  "react-router-dom": "^6.x.x"
}
```

### Files Created
- `src/utils/bidWebSocket.js` - WebSocket polling service
- `src/pages/AuctionPage.jsx` - Auction detail page with real-time updates

### Files Modified
- `src/App.jsx` - Added React Router
- `src/components/AuctionList.jsx` - Navigation to auction pages
- `Backend-1/src/main/api/controllers/BidController.java` - Added broadcast call
- `Backend-1/src/main/api/controllers/WebSocketBidController.java` - Created new file

## API Reference

### Subscribe to Auction Updates
```javascript
import { bidWebSocket } from './utils/bidWebSocket';

const unsubscribe = bidWebSocket.subscribe(auctionId, (data) => {
  if (data.type === 'BID_UPDATE') {
    console.log('New bid:', data.bid);
    console.log('Auction ID:', data.auctionId);
    console.log('Current highest:', data.currentHighestBid);
  }
});

// Cleanup
unsubscribe();
```

### Navigate to Auction Page
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/auction/${auctionId}`);
```

### Get Auction Details
```javascript
const res = await fetch(`http://localhost:8081/api/auctions/${auctionId}`);
const data = await res.json();
if (data.success) {
  const auction = data.data;
}
```

### Get Bid History
```javascript
const res = await fetch(`http://localhost:8081/api/bids/history?auctionId=${auctionId}`);
const data = await res.json();
if (data.success) {
  const bids = data.data; // Array of bid objects
}
```

## Summary

This implementation provides real-time bid broadcasting using:
- **Backend**: `WebSocketBidController` for managing subscribers and broadcasting updates
- **Frontend**: HTTP polling via `bidWebSocket` service (2-second intervals)
- **React Router**: Separate pages for auction list and individual auction details
- **Auto-refresh**: Bid history and auction data update automatically when new bids arrive

The system allows multiple users to view the same auction and see bid updates in real-time without manual page refreshes.
