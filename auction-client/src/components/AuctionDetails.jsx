import React from 'react'
import BidPanel from './BidPanel'
import ChatBox from './ChatBox'

export default function AuctionDetails({ auction }) {
  return (
    <div>
      <h2>{auction ? auction.itemName : 'Auction details (placeholder)'}</h2>
      <BidPanel auctionId={auction ? auction.auctionId : 'placeholder'} />
      <ChatBox auctionId={auction ? auction.auctionId : 'placeholder'} />
    </div>
  )
}
