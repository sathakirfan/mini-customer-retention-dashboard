'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLeads } from '@/hooks/useLeads';
import { formatDate, getFollowUpStatus } from '@/utils/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  Target,
  IndianRupee,
  AlertTriangle,
  Calendar,
  MessageSquare,
  ArrowRight,
  Clock,
  Sparkles,
  UserPlus,
  RefreshCw,
  CheckCircle,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { leads, isLoading } = useLeads();

  // 1. Calculations for KPIs
  const kpis = React.useMemo(() => {
    const total = leads.length;
    
    // Active pipeline includes New, Contacted, Negotiation status
    const activePipeline = leads
      .filter((l) => ['New', 'Contacted', 'Negotiation'].includes(l.status))
      .reduce((sum, l) => sum + l.expectedRevenue, 0);

    // Won revenue
    const wonRevenue = leads
      .filter((l) => l.status === 'Won')
      .reduce((sum, l) => sum + l.expectedRevenue, 0);

    // Conversion rate: Won / (Won + Lost)
    const wonCount = leads.filter((l) => l.status === 'Won').length;
    const lostCount = leads.filter((l) => l.status === 'Lost').length;
    const resolvedCount = wonCount + lostCount;
    const conversionRate = resolvedCount > 0 ? (wonCount / resolvedCount) * 100 : 0;

    return {
      total,
      activePipeline,
      wonRevenue,
      conversionRate,
    };
  }, [leads]);

  // 2. Filter Follow-ups (Overdue + Today)
  const urgentFollowUps = React.useMemo(() => {
    return leads
      .filter((lead) => {
        if (lead.status === 'Won' || lead.status === 'Lost' || !lead.nextFollowUp) {
          return false;
        }
        const status = getFollowUpStatus(lead.nextFollowUp);
        return status === 'overdue' || status === 'today';
      })
      .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime())
      .slice(0, 5);
  }, [leads]);

  // 3. Compute Follow-ups KPI Card details
  const followUpMetrics = React.useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost' && l.nextFollowUp);
    const overdueList = activeLeads.filter(l => getFollowUpStatus(l.nextFollowUp!) === 'overdue');
    const todayList = activeLeads.filter(l => getFollowUpStatus(l.nextFollowUp!) === 'today');
    const count = overdueList.length + todayList.length;
    
    let colorClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    let dotClass = 'bg-emerald-500';
    
    if (overdueList.length > 0) {
      colorClass = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
      dotClass = 'bg-rose-500 animate-pulse';
    } else if (todayList.length > 0) {
      colorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      dotClass = 'bg-amber-500';
    }
    
    return {
      count,
      colorClass,
      dotClass
    };
  }, [leads]);

  // 4. Process data for Pipeline Chart
  const pipelineChartData = React.useMemo(() => {
    const counts = {
      New: 0,
      Contacted: 0,
      Negotiation: 0,
      Won: 0,
      Lost: 0,
    };

    leads.forEach((l) => {
      if (l.status in counts) {
        counts[l.status as keyof typeof counts]++;
      }
    });

    return [
      { name: 'New', count: counts.New, fill: '#64748b' },
      { name: 'Contacted', count: counts.Contacted, fill: '#3b82f6' },
      { name: 'Negotiation', count: counts.Negotiation, fill: '#f59e0b' },
      { name: 'Won', count: counts.Won, fill: '#10b981' },
      { name: 'Lost', count: counts.Lost, fill: '#ef4444' },
    ];
  }, [leads]);

  // 5. Collect Recent Notes from all leads for Recent Activity Timeline
  const recentActivities = React.useMemo(() => {
    interface ActivityItem {
      leadId: string;
      leadName: string;
      noteId: string;
      content: string;
      createdAt: string;
    }
    const list: ActivityItem[] = [];

    leads.forEach((l) => {
      if (l.notes) {
        l.notes.forEach((note) => {
          list.push({
            leadId: l.id,
            leadName: l.name,
            noteId: note.id,
            content: note.content,
            createdAt: note.createdAt,
          });
        });
      }
    });

    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [leads]);

  // Helper for timeline icon and coloring based on log note text
  const getActivityMetaData = (content: string) => {
    const lower = content.toLowerCase();
    if (lower.includes('created') || lower.includes('added') || lower.includes('register')) {
      return { Icon: UserPlus, colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-950/20' };
    }
    if (lower.includes('status') || lower.includes('stage') || lower.includes('phase')) {
      return { Icon: RefreshCw, colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/25 dark:bg-amber-950/20' };
    }
    if (lower.includes('revenue') || lower.includes('budget') || lower.includes('offer') || lower.includes('₹')) {
      return { Icon: IndianRupee, colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/25 dark:bg-indigo-950/20' };
    }
    if (lower.includes('complete') || lower.includes('finish') || lower.includes('done')) {
      return { Icon: CheckCircle, colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-950/20' };
    }
    return { Icon: MessageSquare, colorClass: 'text-slate-500 bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800' };
  };

  // Skeleton screen while Loading
  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-32 w-full bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/35 dark:border-zinc-800/30 rounded-2xl" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/35 dark:border-zinc-800/30 rounded-xl" />
          ))}
        </div>

        {/* Content grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[280px] bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/35 dark:border-zinc-800/30 rounded-xl" />
            <div className="h-[280px] bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/35 dark:border-zinc-800/30 rounded-xl" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-[580px] bg-slate-100 dark:bg-zinc-900/60 border border-slate-200/35 dark:border-zinc-800/30 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full premium-gradient-mesh">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-zinc-950 py-4 px-6 sm:py-5 sm:px-7 text-white shadow-xl transition-all duration-300 hover:shadow-indigo-500/10">
        <div className="absolute right-0 top-0 h-44 w-44 translate-x-12 -translate-y-12 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-32 w-32 translate-y-12 rounded-full bg-purple-500/10 blur-3xl" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md border border-white/15">
            <Sparkles className="h-3 w-3 text-indigo-300 animate-pulse" />
            Hyperlocal Business Intelligence
          </div>
          <h2 className="text-2xl font-black sm:text-3xl tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Welcome Back, Business Partner
          </h2>
          <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
            Snapshot of your pipeline. You have{' '}
            <span className="font-bold text-indigo-300 decoration-indigo-400/30 underline decoration-2 underline-offset-4">{urgentFollowUps.length} follow-ups</span> scheduled for today or overdue.
          </p>
        </div>
      </div>

      {/* KPI Overview Grid - Extended to 5 columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Leads */}
        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Total Leads</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{kpis.total}</p>
            </div>
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Pipeline Value */}
        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Active Pipeline</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                ₹{kpis.activePipeline.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Target className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Won Closed Revenue */}
        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Won Revenue</span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{kpis.wonRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Win Rate</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">
                {kpis.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </CardContent>
        </Card>

        {/* 5th KPI Card: Pending Follow-ups with alert indicator */}
        <Card className="glass-card premium-shadow hover-lift glow-primary border-none">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${followUpMetrics.dotClass} shrink-0`} />
                Pending Follow-ups
              </span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight">{followUpMetrics.count}</p>
            </div>
            <Link
              href="/follow-ups"
              className={cn(
                "h-11 w-11 flex items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95",
                followUpMetrics.colorClass
              )}
              title="View Follow-ups Dashboard"
            >
              <ChevronRight className="h-5.5 w-5.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Urgent Tasks and Pipeline Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Urgent Actions & Recent updates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Actions */}
          <Card className="glass-card premium-shadow border-none">
            <CardHeader className="pb-3 border-b border-slate-100/50 dark:border-zinc-800/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-950 dark:text-zinc-50">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Urgent Follow-Ups
              </CardTitle>
              <CardDescription className="text-slate-400 dark:text-zinc-400">
                Clients requiring immediate phone calls or emails due today or overdue.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              {urgentFollowUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-1.5">
                  <Calendar className="h-7 w-7 text-slate-300 dark:text-zinc-500" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">All caught up!</p>
                  <p className="text-xs">No follow-ups overdue or scheduled for today.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/50 dark:divide-zinc-800/50">
                  {urgentFollowUps.map((lead) => {
                    const status = getFollowUpStatus(lead.nextFollowUp!);
                    return (
                      <div key={lead.id} className="py-3.5 flex items-center justify-between group transition-colors duration-150 hover:bg-slate-50/20 dark:hover:bg-zinc-900/10 px-2 rounded-lg">
                        <div className="min-w-0 space-y-1">
                          <Link href={`/leads/${lead.id}`} className="font-bold text-sm text-slate-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 truncate block">
                            {lead.name}
                          </Link>
                          <div className="flex items-center gap-2.5 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                              {status === 'overdue' ? 'Overdue' : 'Due Today'} ({formatDate(lead.nextFollowUp!)})
                            </span>
                            <span>•</span>
                            <span className="font-medium">{lead.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/leads/${lead.id}`}
                            className={buttonVariants({ variant: 'ghost', size: 'icon-xs', className: 'opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600' })}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Chart */}
          <Card className="glass-card premium-shadow border-none">
            <CardHeader className="pb-3 border-b border-slate-100/50 dark:border-zinc-800/50">
              <CardTitle className="text-lg font-bold text-slate-950 dark:text-zinc-50">Pipeline Funnel Distribution</CardTitle>
              <CardDescription className="text-slate-400 dark:text-zinc-400">Visual state breakdown of all registered leads.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800/40" />
                    <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#09090b', border: '1px solid rgba(63, 63, 70, 0.4)', borderRadius: '10px', color: '#fff', fontSize: '12px', backdropFilter: 'blur(8px)' }}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={40}>
                      {pipelineChartData.map((entry, index) => {
                        let barColor = entry.fill;
                        if (entry.name === 'Contacted') barColor = '#6366f1';
                        else if (entry.name === 'Negotiation') barColor = '#8b5cf6';
                        else if (entry.name === 'Won') barColor = '#10b981';
                        else if (entry.name === 'Lost') barColor = '#f43f5e';
                        else if (entry.name === 'New') barColor = '#94a3b8';
                        return <Cell key={`cell-${index}`} fill={barColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upgraded Structured Activity Timeline */}
        <div className="lg:col-span-1">
          <Card className="glass-card premium-shadow h-full border-none">
            <CardHeader className="border-b border-slate-100/50 dark:border-zinc-800/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-950 dark:text-zinc-50">
                <Clock className="h-5 w-5 text-indigo-500" />
                Recent Activity Timeline
              </CardTitle>
              <CardDescription className="text-slate-400 dark:text-zinc-400">
                Audit trail and client actions feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-2">
                  <Clock className="h-7 w-7 text-slate-300 dark:text-zinc-500" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">No activity logged</p>
                  <p className="text-xs">Timeline logs will stream here in real-time as notes and edits occur.</p>
                </div>
              ) : (
                <div className="relative border-l border-indigo-100/40 pl-5 ml-2.5 space-y-5 dark:border-zinc-800/55">
                  {recentActivities.map((act) => {
                    const meta = getActivityMetaData(act.content);
                    const IconComp = meta.Icon;
                    return (
                      <div key={act.noteId} className="relative group space-y-1.5">
                        {/* Custom Timeline Icon Badge */}
                        <div className={cn(
                          "absolute -left-[35px] top-0.5 flex h-7.5 w-7.5 items-center justify-center rounded-full border shadow-xs transition-transform duration-200 group-hover:scale-105",
                          meta.colorClass
                        )}>
                          <IconComp className="h-3.5 w-3.5" />
                        </div>
                        
                        <div className="text-xs pl-2.5">
                          <Link href={`/leads/${act.leadId}`} className="font-bold text-slate-900 hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400">
                            {act.leadName}
                          </Link>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-zinc-300 pl-2.5 line-clamp-3 leading-relaxed bg-white/40 dark:bg-zinc-900/10 p-2.5 rounded-lg border border-slate-100/50 dark:border-zinc-900/20 group-hover:bg-white/80 dark:group-hover:bg-zinc-900/40 transition-colors">
                          {act.content}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold block pl-2.5">
                          {formatDate(act.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
