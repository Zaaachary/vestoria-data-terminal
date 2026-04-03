import { useMemo } from 'react';

interface PricePoint {
  date: string;
  close: number;
}

interface SparklineProps {
  data: PricePoint[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  isPositive?: boolean;
}

/**
 * Sparkline - Mini line chart for watchlist
 * Renders a simple SVG line chart without axes, labels, or interaction
 */
export default function Sparkline({
  data,
  width = 100,
  height = 32,
  strokeWidth = 1.5,
  isPositive = true,
}: SparklineProps) {
  const pathD = useMemo(() => {
    if (data.length < 2) return '';

    // Find min/max for scaling
    const prices = data.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1; // Avoid division by zero

    // Add padding
    const padding = { top: 3, bottom: 3, left: 2, right: 2 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Generate points
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.close - min) / range) * chartHeight;
      return `${x},${y}`;
    });

    // Build path
    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  // Determine color based on trend
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  // Generate fill path (close the loop at bottom)
  const fillPathD = useMemo(() => {
    if (data.length < 2) return '';

    const prices = data.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const padding = { top: 3, bottom: 3, left: 2, right: 2 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.close - min) / range) * chartHeight;
      return `${x},${y}`;
    });

    const bottomY = height - padding.bottom;
    
    return `M ${points.join(' L ')} L ${width - padding.right},${bottomY} L ${padding.left},${bottomY} Z`;
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '10px',
        }}
      >
        -
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block' }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Gradient fill area */}
      <defs>
        <linearGradient id={`sparklineGradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Fill area */}
      <path
        d={fillPathD}
        fill={`url(#sparklineGradient-${isPositive ? 'up' : 'down'})`}
        stroke="none"
      />
      
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
