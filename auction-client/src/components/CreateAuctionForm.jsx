import React, { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const API_BASE = 'http://localhost:8081/api'

export default function CreateAuctionForm({ onCreated }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    itemName: '',
    itemDescription: '',
    sellerId: user?.username || '',
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

    if (!form.itemName || !form.basePrice) {
      setError('Please fill out item name and base price')
      return
    }

    setLoading(true)
    try {
      const body = {
        itemName: form.itemName,
        itemDescription: form.itemDescription,
        sellerId: user?.username || form.sellerId,
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
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">Create New Auction</h3>
        <p className="text-muted-foreground mt-1">List an item for auction</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name *</Label>
            <Input 
              id="itemName"
              name="itemName" 
              value={form.itemName} 
              onChange={handleChange} 
              placeholder="e.g., Vintage Watch"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="general">General</option>
              <option value="electronics">Electronics</option>
              <option value="collectibles">Collectibles</option>
              <option value="art">Art</option>
              <option value="vehicles">Vehicles</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="itemDescription">Description</Label>
          <textarea
            id="itemDescription"
            name="itemDescription"
            value={form.itemDescription}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your item..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Starting Price *</Label>
            <Input 
              id="basePrice"
              name="basePrice" 
              value={form.basePrice} 
              onChange={handleChange} 
              type="number" 
              step="0.01"
              placeholder="0.00"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input 
              id="duration"
              name="duration" 
              value={form.duration} 
              onChange={handleChange} 
              type="number" 
              min={1}
              placeholder="60"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating...' : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Auction
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}
      </form>
    </div>
  )
}