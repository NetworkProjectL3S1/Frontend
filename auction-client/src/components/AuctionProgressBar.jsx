import React from 'react';

/**
 * Progress bar component showing auction time remaining
 * Green when plenty of time left, yellow when medium, red when ending soon
 */
export default function AuctionProgressBar({ timeRemaining, duration }) {
  // Calculate percentage of time remaining
  const percentage = duration > 0 ? Math.max(0, Math.min(100, (timeRemaining / duration) * 100)) : 0;
  
  // Determine color based on remaining time percentage
  const getColor = () => {
    if (percentage > 50) return 'bg-green-500'; // More than 50% time left
    if (percentage > 20) return 'bg-yellow-500'; // 20-50% time left
    return 'bg-red-500'; // Less than 20% time left (ending soon)
  };
  
  const getTextColor = () => {
    if (percentage > 50) return 'text-green-700';
    if (percentage > 20) return 'text-yellow-700';
    return 'text-red-700';
  };
  
  const getBgColor = () => {
    if (percentage > 50) return 'bg-green-100';
    if (percentage > 20) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-semibold ${getTextColor()}`}>
          {percentage.toFixed(1)}% time remaining
        </span>
      </div>
      <div className={`w-full h-3 ${getBgColor()} rounded-full overflow-hidden border border-gray-300`}>
        <div
          className={`h-full ${getColor()} transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
