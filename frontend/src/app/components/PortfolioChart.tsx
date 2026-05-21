"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
// {/* Central API client (no axios) */}
import { getPortfolioHistory } from "@/lib/api";
import { Line } from "react-chartjs-2";

type Point = { date: string; value: number };

export default function PortfolioChart() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await getPortfolioHistory();
        if (!cancelled) setData(Array.isArray(d) ? d : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, user]);

  if (!isLoaded || !user) return <div>Please log in to see your chart.</div>;
  if (loading || !data.length) return <div>Loading chart...</div>;

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: "Portfolio Value ($)", // <-- App-Währung $
        data: data.map(d => d.value),
        fill: false,
        borderColor: "rgb(168,85,247)",
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">Portfolio Value History</h3>
      <Line data={chartData} />
    </div>
  );
}
