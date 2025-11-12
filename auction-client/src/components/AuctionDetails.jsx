import React, { useEffect, useState } from 'react'
import BidPanel from './BidPanel'
import ChatBox from './ChatBox'

const API_BASE = 'http://localhost:8081/api'

export default function AuctionDetails({ auction, onClose, onRefresh }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (auction?.auctionId) fetchHistory()
  }, [auction])

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bids/history?auctionId=${encodeURIComponent(auction.auctionId)}`)
      const data = await res.json()
      if (data.success) setHistory(data.data || [])
      else setError(data.error || 'Failed to load history')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auction-details">
      <div className="details-header">
        <div>
          <h2>{auction?.itemName}</h2>
          <div className="muted">{auction?.category || 'General'} • Seller: {auction?.sellerId}</div>
        </div>
        <div className="details-actions">
          {onRefresh && <button className="btn btn-outline" onClick={onRefresh}>Refresh List</button>}
          {onClose && <button className="btn" onClick={onClose}>Close</button>}
        </div>
      </div>

      <div className="details-body">
        <div className="details-left">
          <div className="details-card">
            <p className="desc">{auction?.itemDescription}</p>
            <ul className="details-stats">
              <li><strong>Start:</strong> ${Number(auction?.basePrice || 0).toFixed(2)}</li>
              <li><strong>Current:</strong> ${Number(auction?.currentHighestBid || auction?.basePrice || 0).toFixed(2)}</li>
              <li><strong>Status:</strong> {auction?.status}</li>
              <li><strong>Ends:</strong> {auction?.endTime ? new Date(auction.endTime).toLocaleString() : '—'}</li>
            </ul>
          </div>

          <div className="bid-history">
            <h3>Bid History</h3>
            {loading && <div>Loading bids…</div>}
            {error && <div className="error">{error}</div>}
            {!loading && history.length === 0 && <div className="muted">No bids yet</div>}
            {!loading && history.length > 0 && (
              <ul>
                {history.map((b, i) => (
                  <li key={i} className="bid-row">
                    <span className="bid-user">{b.userId}</span>
                    <span className="bid-amount">${Number(b.amount).toFixed(2)}</span>
                    <span className="bid-time">{new Date(b.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="details-right">
          <BidPanel auctionId={auction?.auctionId} currentHighest={auction?.currentHighestBid || auction?.basePrice} onBidded={() => { fetchHistory(); if (onRefresh) onRefresh(); }} />
          <ChatBox auctionId={auction?.auctionId} />
        </div>
      </div>
    </div>
  )
}
