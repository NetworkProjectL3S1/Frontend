import React, { useState } from 'react'
import { DollarSign, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'

const API_BASE = 'http://localhost:8081/api'

export default function BidPanel({ auctionId, currentHighest = 0, onBidded, disabled = false }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handlePlace = async (e) => {
    e && e.preventDefault()
    
    if (disabled) {
      setError('This auction has expired. No more bids can be placed.')
      return
    }
    
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
        body: JSON.stringify({ auctionId, userId: user?.username || 'Guest', amount: value })
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
    <Card className={`border-2 shadow-lg ${disabled ? 'border-red-300 bg-red-50/50' : 'border-primary/20'}`}>
      <CardHeader className={disabled ? 'bg-red-100/50' : 'bg-gradient-to-r from-primary/10 to-accent/10'}>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className={`h-5 w-5 ${disabled ? 'text-red-500' : 'text-primary'}`} />
          {disabled ? 'Auction Expired' : 'Place a Bid'}
        </CardTitle>
        <CardDescription className="font-semibold">
          {disabled ? 'This auction has ended' : `Minimum bid: $${(Number(currentHighest) + 0.01).toFixed(2)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handlePlace} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bid-amount" className="text-sm font-semibold">Bid Amount</Label>
            <Input
              id="bid-amount"
              type="number"
              step="0.01"
              placeholder={disabled ? 'Auction expired' : `Min ${(Number(currentHighest) + 0.01).toFixed(2)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || disabled}
              className="border-2 text-lg font-semibold"
            />
          </div>
          
          <Button className="w-full font-semibold" type="submit" disabled={loading || disabled}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {disabled ? 'Bidding Closed' : loading ? 'Placing Bid...' : 'Place Bid'}
          </Button>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border-2 border-destructive/20 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border-2 border-green-200 font-medium">
              {success}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
