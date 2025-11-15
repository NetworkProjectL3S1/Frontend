import React, { useEffect, useState } from 'react'
import { X, RefreshCw, Clock, User, DollarSign } from 'lucide-react'
import BidPanel from './BidPanel'
import ChatBox from './ChatBox'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

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
    <Card className="w-full border-2">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl">{auction?.itemName}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="border-accent/50 bg-accent/10 text-accent">
                {auction?.category || 'General'}
              </Badge>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Seller: <span className="font-semibold">{auction?.sellerId}</span>
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-2">
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-muted-foreground">
                  {auction?.itemDescription || 'No description provided'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Starting Price</p>
                      <p className="text-lg font-bold">${Number(auction?.basePrice || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="text-lg font-bold text-primary">
                        ${Number(auction?.currentHighestBid || auction?.basePrice || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ends At</p>
                      <p className="text-sm font-medium">
                        {auction?.endTime ? new Date(auction.endTime).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                    <Badge variant={auction?.status === 'ACTIVE' ? 'default' : 'secondary'} className="font-semibold">
                      {auction?.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="bg-slate-50">
                <CardTitle className="text-lg">Bid History</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {error && <p className="text-destructive text-sm">{error}</p>}
                {!loading && history.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No bids yet</p>
                )}
                {!loading && history.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((b, i) => (
                      <div key={i} className="flex items-center justify-between py-3 px-3 border-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{b.userId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary text-lg">${Number(b.amount).toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(b.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <BidPanel 
              auctionId={auction?.auctionId} 
              currentHighest={auction?.currentHighestBid || auction?.basePrice} 
              onBidded={() => { fetchHistory(); if (onRefresh) onRefresh(); }} 
            />
            <ChatBox auctionId={auction?.auctionId} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
