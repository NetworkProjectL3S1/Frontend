import React, { useEffect, useState } from 'react'
import { RefreshCw, Plus, X } from 'lucide-react'
import AuctionDetails from './AuctionDetails'
import CreateAuctionForm from './CreateAuctionForm'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

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
    <div className="container mx-auto py-10 px-6 md:px-8 lg:px-12">md:px-8 lg:px-12">
      <div className="flex justify-between items-center mb-10 mt-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Auctions</h2>
          <p className="text-muted-foreground mt-1">Browse and bid on active auctions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAuctions()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(v => !v)}>
            {showCreate ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showCreate ? 'Close' : 'Create Auction'}
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <CreateAuctionForm onCreated={() => { setShowCreate(false); fetchAuctions() }} />
          </CardContent>
        </Card>
      )}

      {loading && !auctions.length && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading auctions...</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Array.isArray(auctions) ? auctions : []).map((a) => (
          <Card 
            key={a.auctionId || a.id || JSON.stringify(a)}
            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
              selected?.auctionId === a.auctionId 
                ? 'ring-2 ring-primary border-primary shadow-md' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleSelect(a)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl truncate">{a.itemName}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {a.itemDescription || 'No description'}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="shrink-0 bg-accent/10 text-accent border border-accent/20">
                  {a.category || 'General'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <span className="text-sm font-medium text-muted-foreground">Current Bid</span>
                  <span className="text-2xl font-bold text-primary">
                    ${Number(a.currentHighestBid || a.basePrice || 0).toFixed(2)}
                  </span>
                </div>
                {a.currentHighestBidder && (
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-muted-foreground">Highest Bidder</span>
                    <span className="font-medium">{a.currentHighestBidder}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm border-t pt-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'} className="font-semibold">
                    {a.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && auctions.length === 0 && !error && (
        <Card className="mt-8">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No auctions available. Create one to get started!</p>
          </CardContent>
        </Card>
      )}

      {selected && (
        <div className="mt-8">
          <AuctionDetails auction={selected} onClose={() => setSelected(null)} onRefresh={fetchAuctions} />
        </div>
      )}
    </div>
  )
}
