"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#065f46", "#111111", "#c8a640", "#16a34a", "#737373", "#991b1b"];

export function DashboardCharts({
  byMinistry,
  byCategory,
  maintenanceTrend,
  disposalSummary,
}: {
  byMinistry: { name: string; assets: number; value: number }[];
  byCategory: { name: string; count: number }[];
  maintenanceTrend: { month: string; cost: number }[];
  disposalSummary: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-6">
      <ChartFrame title="Asset value by institution" description="Estimated asset value across government institutions." className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byMinistry}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`} />
            <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString("en-KE")}`, "Value"]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#065f46" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Asset count by category" description="Universal register mix." className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={byCategory} dataKey="count" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
              {byCategory.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Maintenance cost trend" description="Quarter-to-date spend exposure." className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={maintenanceTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="cost" stroke="#065f46" fill="#065f46" fillOpacity={0.18} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ChartFrame title="Disposal readiness" description="Assets ready, in review or retained." className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={disposalSummary}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#c8a640" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function ChartFrame({ title, description, className, children }: { title: string; description: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`h-80 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 ${className ?? ""}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <div className="h-[78%]">{children}</div>
    </div>
  );
}
