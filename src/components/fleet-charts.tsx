"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#065f46", "#111111", "#c8a640", "#16a34a", "#737373", "#991b1b"];

export function FleetCharts({
  byInstitution,
  fuelTrend,
  mileageTrend,
  serviceCostByVehicle,
  conditionSummary,
}: {
  byInstitution: { name: string; count: number }[];
  fuelTrend: { month: string; cost: number }[];
  mileageTrend: { month: string; mileage: number }[];
  serviceCostByVehicle: { name: string; cost: number }[];
  conditionSummary: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      <Frame title="Vehicle count by institution" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byInstitution}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#065f46" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Frame>
      <Frame title="Vehicle condition summary" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={conditionSummary} dataKey="count" nameKey="name" innerRadius={52} outerRadius={86}>
              {conditionSummary.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Frame>
      <Frame title="Service cost by vehicle" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serviceCostByVehicle}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="cost" fill="#c8a640" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Frame>
      <Frame title="Fuel cost trend" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={fuelTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="cost" stroke="#065f46" fill="#065f46" fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </Frame>
      <Frame title="Mileage trend" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mileageTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="mileage" stroke="#111111" fill="#c8a640" fillOpacity={0.22} />
          </AreaChart>
        </ResponsiveContainer>
      </Frame>
    </div>
  );
}

function Frame({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`h-80 min-w-0 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-[240px] min-h-[240px] min-w-0">{children}</div>
    </div>
  );
}
