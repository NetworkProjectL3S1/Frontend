import React, { useState } from 'react'

const API_BASE = 'http://localhost:8081/api'

export default function BidPanel({ auctionId, currentHighest = 0, onBidded }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handlePlace = async (e) => {
    e && e.preventDefault()
    setError(null)
    setSuccess(null)
    const value = parseFloat(amount)
    if (isNaN(value) || value <= Number(currentHighest)) {
      setError(`Bid must be higher than current ${Number(currentHighest).toFixed(2)}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/bids/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, userId: 'currentUser', amount: value })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Bid placed successfully')
        setAmount('')
        if (onBidded) onBidded(data.data)
      } else {
        setError(data.error || 'Failed to place bid')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bid-panel">
      <h3>Place a Bid</h3>
      <form onSubmit={handlePlace} className="bid-form">
        <input
          aria-label="bid-amount"
          type="number"
          step="0.01"
          placeholder={`Min ${(Number(currentHighest) + 0.01).toFixed(2)}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Placing…' : 'Place Bid'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  )
}
