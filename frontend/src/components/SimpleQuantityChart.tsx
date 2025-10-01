// frontend/src/components/SimpleQuantityChart.tsx — [Frontend]
// {/* Simple Quantity Bar Chart - Compact & Clean */}
"use client";

import React from 'react';
import { BarChart3 } from 'lucide-react';

interface QuantityData {
  date: string;
  quantity: number;
}

interface SimpleQuantityChartProps {
  data: QuantityData[];
  className?: string;
}

const SimpleQuantityChart: React.FC<SimpleQuantityChartProps> = ({ data, className = "" }) => {
  console.log('[SimpleQuantityChart] Received data:', data?.length, 'items');
  console.log('[SimpleQuantityChart] First 3 items:', data?.slice(0, 3));
  
  if (!data || data.length === 0) {
    console.log('[SimpleQuantityChart] No data - showing empty state');
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No quantity data available</p>
      </div>
    );
  }

  const maxQuantity = Math.max(...data.map(d => d.quantity));
  const minQuantity = Math.min(...data.map(d => d.quantity));
  
  console.log('[SimpleQuantityChart] Max quantity:', maxQuantity, 'Min:', minQuantity);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart Container */}
      <div className="relative h-[220px] md:h-[160px] px-2 border border-red-500">
        <div className="flex items-end h-full gap-1 border border-green-500">
          {data.map((item, index) => {
            const heightPercent = maxQuantity > 0 ? (item.quantity / maxQuantity) * 100 : 0;
            const finalHeight = Math.max(heightPercent, 2);
            
            // Debug logging for first few items
            if (index < 3) {
              console.log(`[SimpleQuantityChart] Item ${index}:`, {
                quantity: item.quantity,
                heightPercent: heightPercent,
                finalHeight: finalHeight,
                maxQuantity: maxQuantity
              });
            }
            
            return (
              <div 
                key={item.date} 
                className="flex flex-col items-center justify-end group"
                style={{ width: `${100 / data.length}%` }}
                title={`${formatDate(item.date)}: ${item.quantity} (${finalHeight.toFixed(1)}%)`}
              >
              {/* Bar */}
              <div
                className="w-full bg-blue-500/60 hover:bg-blue-500/80 rounded-t-sm transition-colors cursor-pointer border border-yellow-500"
                style={{ height: `${finalHeight}%` }}
              />
              </div>
            );
          })}
        </div>
        
        {/* X-axis date labels below chart */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {data.filter((_, index) => index % Math.ceil(data.length / 5) === 0).map((item) => (
            <span key={item.date}>{formatDate(item.date)}</span>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute -left-10 top-0 h-[220px] md:h-[160px] flex flex-col justify-between text-xs text-muted-foreground">
          <span>{maxQuantity}</span>
          <span>{Math.floor(maxQuantity / 2)}</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleQuantityChart;

