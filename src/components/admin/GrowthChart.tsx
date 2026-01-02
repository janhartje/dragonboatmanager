'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GrowthChartProps {
  data: { date: string; count: number }[];
  resolution: 'days' | 'months';
  color: string;
}

export default function GrowthChart({ data, resolution, color }: GrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => {
            const date = new Date(value);
            if (resolution === 'months') {
                return date.toLocaleDateString('default', { month: 'short' });
            }
            return date.toLocaleDateString('default', { day: '2-digit', month: '2-digit' });
          }}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
          dy={10}
          minTickGap={30}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          cursor={{ fill: 'transparent' }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
