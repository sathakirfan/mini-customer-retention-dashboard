'use client';

import * as React from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import {
  PieChartIcon,
  Activity,
  Award,
  IndianRupee,
  Compass,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const COLORS = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#64748b'
];

const STAGE_ORDER = ['New', 'Contacted', 'Negotiation', 'Won', 'Lost'];
const STAGE_COLORS: Record<string, string> = {
  New: '#64748b',
  Contacted: '#6366f1',
  Negotiation: '#f59e0b',
  Won: '#10b981',
  Lost: '#f43f5e',
};

export default function AnalyticsPage() {
  const { leads, isLoading } = useLeads();

  const metrics = React.useMemo(() => {
    const total = leads.length;
    if (total === 0) return { avgDealSize: 0, topSource: '-', wonCount: 0, conversionRate: 0, totalRevenue: 0, pendingCount: 0 };

    const totalRevenue = leads.reduce((sum, l) => sum + l.expectedRevenue, 0);
    const avgDealSize = totalRevenue / total;

    const sourceCounts: Record<string, number> = {};
    leads.forEach((l) => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
    let topSource = '-'; let maxCount = 0;
    Object.entries(sourceCounts).forEach(([src, count]) => { if (count > maxCount) { maxCount = count; topSource = src; } });

    const wonCount = leads.filter((l) => l.status === 'Won').length;
    const lostCount = leads.filter((l) => l.status === 'Lost').length;
    const resolved = wonCount + lostCount;
    const conversionRate = resolved > 0 ? (wonCount / resolved) * 100 : 0;
    const pendingCount = leads.filter((l) => l.status === 'New' || l.status === 'Contacted').length;

    return { avgDealSize, topSource, wonCount, conversionRate, totalRevenue, pendingCount };
  }, [leads]);

  const sourceChartData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const revenueChartData = React.useMemo(() => {
    const revenueByStage = { New: 0, Contacted: 0, Negotiation: 0, Won: 0, Lost: 0 };
    leads.forEach((l) => { if (l.status in revenueByStage) revenueByStage[l.status as keyof typeof revenueByStage] += l.expectedRevenue; });
    return [
      { name: 'New', Revenue: revenueByStage.New, fill: '#64748b' },
      { name: 'Contacted', Revenue: revenueByStage.Contacted, fill: '#6366f1' },
      { name: 'Negotiation', Revenue: revenueByStage.Negotiation, fill: '#f59e0b' },
      { name: 'Won', Revenue: revenueByStage.Won, fill: '#10b981' },
      { name: 'Lost', Revenue: revenueByStage.Lost, fill: '#ef4444' },
    ];
  }, [leads]);

  // Monthly Revenue Trend (AreaChart) - last 6 months
  const monthlyTrendData = React.useMemo(() => {
    const now = new Date();
    const months: { label: string; Won: number; Pipeline: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      months.push({ label, Won: 0, Pipeline: 0 });
    }

    leads.forEach((l) => {
      const created = new Date(l.createdAt as string);
      if (isNaN(created.getTime())) return;
      const diff = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      if (diff >= 0 && diff <= 5) {
        const idx = 5 - diff;
        if (l.status === 'Won') months[idx].Won += l.expectedRevenue;
        else if (l.status !== 'Lost') months[idx].Pipeline += l.expectedRevenue;
      }
    });

    return months;
  }, [leads]);

  // Funnel data
  const funnelData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.status] = (counts[l.status] || 0) + 1; });
    const max = leads.length || 1;
    return STAGE_ORDER.map((stage) => ({
      stage,
      count: counts[stage] || 0,
      pct: ((counts[stage] || 0) / max) * 100,
      color: STAGE_COLORS[stage],
    }));
  }, [leads]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800 dark:border-zinc-700 dark:border-t-zinc-300" />
          <span className="text-sm text-slate-500 font-medium dark:text-zinc-400">Compiling visual statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">Business Performance Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          In-depth intelligence report showing conversion ratios, value metrics, and marketing source metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Total Pipeline</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                ₹{(metrics.totalRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-slate-400">{leads.length} total leads</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-zinc-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Main Channel</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{metrics.topSource}</p>
              <p className="text-xs text-slate-400">{metrics.pendingCount} leads pending</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Compass className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Closed Won</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{metrics.wonCount} Clients</p>
              <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> All-time
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Conversion Rate</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                {metrics.conversionRate.toFixed(1)}%
              </p>
              <p className={`text-xs font-semibold flex items-center gap-1 ${metrics.conversionRate >= 50 ? 'text-emerald-500' : metrics.conversionRate > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                {metrics.conversionRate >= 50 ? <TrendingUp className="h-3 w-3" /> : metrics.conversionRate > 0 ? <Minus className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                Won vs. lost leads
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend AreaChart */}
      <Card className="glass-card premium-shadow border-none">
        <CardHeader className="border-b border-slate-100/50 dark:border-zinc-800/50 pb-3">
          <CardTitle className="text-base font-bold text-slate-950 dark:text-zinc-50">Revenue Trend — Last 6 Months</CardTitle>
          <CardDescription className="text-slate-400 dark:text-zinc-400">Won revenue vs active pipeline value by month.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPipeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800/40" />
                <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" tickLine={false} />
                <YAxis
                  fontSize={11}
                  stroke="#94a3b8"
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  formatter={(v, name) => [`₹${Number(v).toLocaleString('en-IN')}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Pipeline" stroke="#6366f1" strokeWidth={2} fill="url(#gradPipeline)" name="Active Pipeline" />
                <Area type="monotone" dataKey="Won" stroke="#10b981" strokeWidth={2} fill="url(#gradWon)" name="Won Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deal Value by Stage Bar Chart */}
        <Card className="glass-card premium-shadow border-none">
          <CardHeader className="border-b border-slate-100/50 dark:border-zinc-800/50 pb-3">
            <CardTitle className="text-base font-bold text-slate-950 dark:text-zinc-50">Pipeline Value by Phase (₹)</CardTitle>
            <CardDescription className="text-slate-400 dark:text-zinc-400">Sum of expected contract values grouped by sales progression state.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800/40" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis
                    fontSize={11}
                    stroke="#94a3b8"
                    tickLine={false}
                    tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '10px', color: '#fff', fontSize: '12px', backdropFilter: 'blur(8px)' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Total Value']}
                  />
                  <Bar dataKey="Revenue" radius={[5, 5, 0, 0]} barSize={40}>
                    {revenueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead Source Donut Chart */}
        <Card className="glass-card premium-shadow border-none">
          <CardHeader className="border-b border-slate-100/50 dark:border-zinc-800/50 pb-3">
            <CardTitle className="text-base font-bold text-slate-950 dark:text-zinc-50">Lead Acquisition Channels</CardTitle>
            <CardDescription className="text-slate-400 dark:text-zinc-400">Proportional count representation of incoming client sources.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {sourceChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-center text-slate-400">
                <PieChartIcon className="h-8 w-8 text-slate-200 dark:text-zinc-800" />
                <p className="text-sm font-semibold mt-1">No source statistics yet</p>
              </div>
            ) : (
              <div className="min-h-[20rem] sm:h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-2">
                <div className="h-48 xs:h-52 sm:h-60 w-full sm:w-[60%] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sourceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '10px', color: '#fff', fontSize: '12px', backdropFilter: 'blur(8px)' }}
                        formatter={(value) => [`${value} leads`, 'Count']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-row flex-wrap sm:flex-col justify-center sm:justify-start gap-2.5 w-full sm:w-[40%] text-xs px-2">
                  {sourceChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 sm:justify-between sm:w-full bg-slate-50/50 dark:bg-zinc-900/20 border border-slate-100 dark:border-zinc-900/30 px-2.5 py-1.5 rounded-lg shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-zinc-100 ml-1.5 sm:ml-0">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel */}
      <Card className="glass-card premium-shadow border-none">
        <CardHeader className="border-b border-slate-100/50 dark:border-zinc-800/50 pb-3">
          <CardTitle className="text-base font-bold text-slate-950 dark:text-zinc-50">Sales Pipeline Funnel</CardTitle>
          <CardDescription className="text-slate-400 dark:text-zinc-400">Lead progression across pipeline stages — wider bars indicate larger count.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col items-center gap-2 max-w-lg mx-auto">
            {funnelData.map((item, i) => (
              <div key={item.stage} className="w-full flex flex-col items-center gap-1">
                <div
                  className="relative h-10 rounded-lg flex items-center justify-center transition-all duration-500"
                  style={{
                    width: `${Math.max(item.pct, 12)}%`,
                    minWidth: '120px',
                    backgroundColor: item.color,
                    opacity: item.count === 0 ? 0.25 : 1,
                  }}
                >
                  <span className="text-white text-xs font-bold px-3 truncate">
                    {item.stage}: {item.count}
                  </span>
                </div>
                {i < funnelData.length - 1 && (
                  <div className="text-xs text-slate-300 dark:text-zinc-700">▼</div>
                )}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/50">
            {funnelData.map((item) => (
              <div key={item.stage} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
                <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ backgroundColor: item.color }} />
                {item.stage} ({item.count})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
