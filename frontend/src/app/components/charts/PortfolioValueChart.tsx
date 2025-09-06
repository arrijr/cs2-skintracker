// /frontend/src/app/components/charts/PortfolioValueChart.tsx (Frontend)
"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PortfolioValueChartProps {
  data: Array<{
    date: string;
    value: number;
    invested: number;
  }>;
  className?: string;
}

export default function PortfolioValueChart({ data, className = "" }: PortfolioValueChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-brand-green" />
            <span>Portfolio Value</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-neutral-400">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics
  const currentValue = data[data.length - 1]?.value || 0;
  const currentInvested = data[data.length - 1]?.invested || 0;
  const previousValue = data[data.length - 2]?.value || currentValue;
  const previousInvested = data[data.length - 2]?.invested || currentInvested;
  
  const valueChange = currentValue - previousValue;
  const valueChangePercent = previousValue > 0 ? (valueChange / previousValue) * 100 : 0;
  
  const investedChange = currentInvested - previousInvested;
  const investedChangePercent = previousInvested > 0 ? (investedChange / previousInvested) * 100 : 0;
  
  const unrealizedPL = currentValue - currentInvested;
  const unrealizedPLPercent = currentInvested > 0 ? (unrealizedPL / currentInvested) * 100 : 0;

  // Chart configuration
  const chartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    colors: ['#10B981', '#3B82F6'], // Brand green and blue
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#9CA3AF',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9CA3AF',
        },
        formatter: (value: number) => `$${value.toLocaleString()}`,
      },
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'MMM dd, yyyy',
      },
      y: {
        formatter: (value: number) => `$${value.toLocaleString()}`,
      },
    },
    legend: {
      labels: {
        colors: '#9CA3AF',
      },
    },
  };

  const chartSeries = [
    {
      name: 'Portfolio Value',
      data: data.map(item => ({
        x: new Date(item.date).getTime(),
        y: item.value,
      })),
    },
    {
      name: 'Total Invested',
      data: data.map(item => ({
        x: new Date(item.date).getTime(),
        y: item.invested,
      })),
    },
  ];

  return (
    <Card className={`card-brand ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-brand-green" />
            <span>Portfolio Value</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={unrealizedPL >= 0 ? "border-brand-green/20 text-brand-green" : "border-red-500/20 text-red-400"}
            >
              {unrealizedPL >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {unrealizedPLPercent >= 0 ? '+' : ''}{unrealizedPLPercent.toFixed(1)}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-green">
              ${currentValue.toLocaleString()}
            </div>
            <div className="text-sm text-neutral-400">Current Value</div>
            <div className={`text-xs ${valueChange >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
              {valueChange >= 0 ? '+' : ''}${valueChange.toLocaleString()} ({valueChangePercent >= 0 ? '+' : ''}{valueChangePercent.toFixed(1)}%)
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-blue">
              ${currentInvested.toLocaleString()}
            </div>
            <div className="text-sm text-neutral-400">Total Invested</div>
            <div className={`text-xs ${investedChange >= 0 ? 'text-brand-blue' : 'text-red-400'}`}>
              {investedChange >= 0 ? '+' : ''}${investedChange.toLocaleString()} ({investedChangePercent >= 0 ? '+' : ''}{investedChangePercent.toFixed(1)}%)
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
              ${unrealizedPL.toLocaleString()}
            </div>
            <div className="text-sm text-neutral-400">Unrealized P/L</div>
            <div className={`text-xs ${unrealizedPL >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
              {unrealizedPL >= 0 ? '+' : ''}{unrealizedPLPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="area"
            height="100%"
            width="100%"
          />
        </div>
      </CardContent>
    </Card>
  );
}
