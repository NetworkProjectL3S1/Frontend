import React from 'react'

export default function BidPanel({ auctionId }) {
  // TODO: hook up to socket client to place bids in real time
  return (
    <div>
      <p><strong>BidPanel</strong> placeholder for auction {auctionId}</p>
      <input placeholder="Enter bid amount" />
      <button>Place Bid</button>
    </div>
  )
}
