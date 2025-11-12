import React, { useEffect, useState } from 'react'
import AuctionDetails from './AuctionDetails'
import CreateAuctionForm from './CreateAuctionForm'

const API_BASE = 'http://localhost:8081/api'

export default function AuctionList() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [rawResponse, setRawResponse] = useState(null)

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auctions/list`)
  const data = await res.json()
  // keep raw response for debugging when shape is unexpected
  setRawResponse(data)
  // dump raw response to console for debugging
  console.log('[AuctionList] raw /auctions/list response:', data)

      if (data.success) {
        // Normalize various possible API shapes into an array
        let payload = data.data ?? data
        let items = []

        if (Array.isArray(payload)) {
          items = payload
        } else if (payload && typeof payload === 'object') {
          if (Array.isArray(payload.auctions)) items = payload.auctions
          else if (Array.isArray(payload.items)) items = payload.items
          else if (Array.isArray(payload.results)) items = payload.results
          else items = Object.values(payload)
        } else {
          items = []
        }

  console.log('[AuctionList] normalized items:', items)
  setAuctions(items)
      } else {
        setError(data.error || 'Failed to load')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (auction) => {
    setSelected(auction)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="auction-list-root">
      <div className="list-header">
        <h2>Active Auctions</h2>
        <div className="list-actions">
          <button className="btn btn-outline" onClick={() => fetchAuctions()} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
            {showCreate ? 'Close' : 'Create Auction'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="create-area">
          <CreateAuctionForm onCreated={() => { setShowCreate(false); fetchAuctions() }} />
        </div>
      )}

      {loading && <div className="loading-inline">Loading auctions…</div>}
      {error && <div className="error">Error: {error}</div>}

      <div className="auction-grid">
        {(Array.isArray(auctions) ? auctions : []).map((a) => (
          <div
            key={a.auctionId || a.id || JSON.stringify(a)}
            className={`auction-card ${selected?.auctionId === a.auctionId ? 'selected' : ''}`}
            onClick={() => handleSelect(a)}
          >
            <div className="card-media">
              <div className="media-placeholder">{a.itemName?.charAt(0) || 'A'}</div>
            </div>
            <div className="card-body">
              <h3 className="card-title">{a.itemName}</h3>
              <p className="card-desc">{a.itemDescription}</p>
              <div className="card-meta">
                <span className="meta">${Number(a.currentHighestBid || a.basePrice || 0).toFixed(2)}</span>
                <span className="meta muted">{a.category || 'General'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="details-panel">
          <AuctionDetails auction={selected} onClose={() => setSelected(null)} onRefresh={fetchAuctions} />
        </div>
      )}
    </div>
  )
}
