// /frontend/src/app/dashboard/components/SimplePieChart.tsx — [Frontend]
// {/* Simple Pie Chart Test Component */}
"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: 'Covert', value: 500, color: '#ff6b6b' },
  { name: 'Classified', value: 300, color: '#ff9ff3' },
  { name: 'Restricted', value: 200, color: '#a8e6cf' }
];

export function SimplePieChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
