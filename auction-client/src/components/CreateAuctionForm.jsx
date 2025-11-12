import React, { useState } from 'react'

const API_BASE = 'http://localhost:8081/api'

export default function CreateAuctionForm({ onCreated }) {
  const [form, setForm] = useState({
    itemName: '',
    itemDescription: '',
    sellerId: '',
    basePrice: '',
    duration: '60',
    category: 'general'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.itemName || !form.sellerId || !form.basePrice) {
      setError('Please fill out item name, seller ID and base price')
      return
    }

    setLoading(true)
    try {
      const body = {
        itemName: form.itemName,
        itemDescription: form.itemDescription,
        sellerId: form.sellerId,
        basePrice: parseFloat(form.basePrice),
        duration: parseInt(form.duration, 10),
        category: form.category || 'general'
      }

      const res = await fetch(`${API_BASE}/auctions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Auction created')
        setForm({ ...form, itemName: '', itemDescription: '', basePrice: '' })
        if (onCreated) onCreated(data.data)
      } else {
        setError(data.error || 'Failed to create')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-auction">
      <h3>Create New Auction</h3>
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-row">
          <label>Item Name</label>
          <input name="itemName" value={form.itemName} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <label>Description</label>
          <textarea name="itemDescription" value={form.itemDescription} onChange={handleChange} rows={3} />
        </div>

        <div className="form-row">
          <label>Seller ID</label>
          <input name="sellerId" value={form.sellerId} onChange={handleChange} required />
        </div>

        <div className="form-row two-cols">
          <div>
            <label>Base Price</label>
            <input name="basePrice" value={form.basePrice} onChange={handleChange} type="number" step="0.01" required />
          </div>
          <div>
            <label>Duration (min)</label>
            <input name="duration" value={form.duration} onChange={handleChange} type="number" min={1} />
          </div>
        </div>

        <div className="form-row">
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="general">General</option>
            <option value="electronics">Electronics</option>
            <option value="collectibles">Collectibles</option>
            <option value="art">Art</option>
            <option value="vehicles">Vehicles</option>
          </select>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create'}</button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </form>
    </div>
  )
}
