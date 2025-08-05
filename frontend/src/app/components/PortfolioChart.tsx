"use client";
import { useEffect, useState } from "react";
import { getPortfolioHistory } from "../api/portfolio";
import { useAuth } from "../context/AuthContext";
import { Line } from "react-chartjs-2";

export default function PortfolioChart() {
  const { token } = useAuth();
  const [data, setData] = useState<{ date: string; value: number }[]>([]);

  useEffect(() => {
    if (!token) return;
    getPortfolioHistory(token).then(setData);
  }, [token]);

  if (!token) return <div>Please log in to see your chart.</div>;
  if (!data.length) return <div>Loading chart...</div>;

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: "Portfolio Value (€)",
        data: data.map(d => d.value),
        fill: false,
        borderColor: "rgb(59,130,246)", // blue-500
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-2">Portfolio Value History</h3>
      <Line data={chartData} />
    </div>
  );
}
