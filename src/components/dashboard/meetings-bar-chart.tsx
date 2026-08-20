"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DataPoint {
  date: string;
  label: string;
  total: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: DataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{point.label}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground">{point.total}</span> rapat
      </p>
    </div>
  );
}

/** Bulatkan nilai maksimum data ke "angka rapi" berikutnya agar sumbu-Y tidak menampilkan label pecahan/duplikat. */
function niceMax(maxValue: number): number {
  const max = Math.max(1, maxValue);
  if (max <= 4) return 4;
  if (max <= 10) return Math.ceil(max / 2) * 2;
  return Math.ceil(max / 5) * 5;
}

export function MeetingsBarChart({ data }: { data: DataPoint[] }) {
  const maxValue = data.reduce((max, d) => Math.max(max, d.total), 0);
  const yMax = niceMax(maxValue);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={22}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          dy={6}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, yMax]}
          tickCount={5}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          width={24}
        />
        <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.5 }} content={<ChartTooltip />} />
        <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
