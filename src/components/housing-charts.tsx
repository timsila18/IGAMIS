"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#065f46", "#111111", "#c8a640", "#16a34a", "#737373", "#991b1b"];

export function HousingCharts({
  occupancyByInstitution,
  typeDistribution,
  maintenanceTrend,
  constructionSummary,
  occupancySummary,
}: {
  occupancyByInstitution: { name: string; rate: number }[];
  typeDistribution: { name: string; count: number }[];
  maintenanceTrend: { month: string; cost: number }[];
  constructionSummary: { name: string; progress: number; budget: number; spent: number }[];
  occupancySummary: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      <Frame title="Occupancy rate by institution" className="xl:col-span-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={occupancyByInstitution}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="rate" fill="#065f46" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Frame>
      <Frame title="Unit type distribution" className="xl:col-span-2"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={typeDistribution} dataKey="count" nameKey="name" innerRadius={48} outerRadius={84}>{typeDistribution.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Frame>
      <Frame title="Vacant vs occupied" className="xl:col-span-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={occupancySummary}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#c8a640" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Frame>
      <Frame title="Maintenance cost trend" className="xl:col-span-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={maintenanceTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="cost" stroke="#065f46" fill="#065f46" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></Frame>
      <Frame title="Construction progress summary" className="xl:col-span-3"><ResponsiveContainer width="100%" height="100%"><BarChart data={constructionSummary}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="progress" fill="#111111" radius={[6, 6, 0, 0]} /><Bar dataKey="spent" fill="#c8a640" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Frame>
    </div>
  );
}

function Frame({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return <div className={`h-80 min-w-0 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 ${className ?? ""}`}><h3 className="mb-3 text-sm font-semibold">{title}</h3><div className="h-[240px] min-w-0">{children}</div></div>;
}
