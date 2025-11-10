# Auction Client (placeholder)

This folder contains a minimal React + Vite scaffold intended as a placeholder for the auction frontend.

What to implement
------------------
- Replace placeholder components with full UI in `src/components/`.
- Use `src/utils/socketClient.js` to connect to the backend WebSocket endpoint and send/receive real-time events.
- Expected bid message format (JSON): `{ type: 'BID', auctionId: string, amount: number }`.

Run locally
---------
Install and run:

```bash
cd Frontend/auction-client
npm install
npm run dev
```
