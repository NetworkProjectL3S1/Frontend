// Minimal socket client wrapper (placeholder).
// TODO: replace with WebSocket or Socket.IO client once backend socket endpoints are defined.

export function connect(url) {
  // simple WebSocket example
  const ws = new WebSocket(url);
  ws.onopen = () => console.log('Socket connected', url);
  ws.onclose = () => console.log('Socket closed');
  ws.onerror = (e) => console.error('Socket error', e);
  return ws;
}

export function sendBid(ws, auctionId, amount) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  const payload = JSON.stringify({ type: 'BID', auctionId, amount });
  ws.send(payload);
  return true;
}
