'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLeads } from '@/hooks/useLeads';
import { formatDate, getFollowUpStatus } from '@/utils/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  Search,
  Filter,
  AlertCircle,
  ChevronRight,
  User,
  CalendarCheck,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

type FollowUpTab = 'overdue' | 'today' | 'upcoming' | 'completed';

export default function FollowUpsPage() {
  const { leads, isLoading, editLead, addNoteToLead } = useLeads();
  const [activeTab, setActiveTab] = React.useState<FollowUpTab>('overdue');
  const [search, setSearch] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState('All');
  
  // Reschedule state tracking
  const [reschedulingId, setReschedulingId] = React.useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState('');

  // 1. Group leads by their follow-up stage
  const classifiedFollowUps = React.useMemo(() => {
    const overdue: typeof leads = [];
    const today: typeof leads = [];
    const upcoming: typeof leads = [];
    const completed: typeof leads = []; // Leads with status Won/Lost, or no follow-up date

    leads.forEach((lead) => {
      // If client status is closed (Won/Lost) or has no follow-up date, it's completed
      if (lead.status === 'Won' || lead.status === 'Lost' || !lead.nextFollowUp) {
        completed.push(lead);
        return;
      }

      const status = getFollowUpStatus(lead.nextFollowUp);
      if (status === 'overdue') {
        overdue.push(lead);
      } else if (status === 'today') {
        today.push(lead);
      } else if (status === 'upcoming') {
        upcoming.push(lead);
      } else {
        completed.push(lead);
      }
    });

    return { overdue, today, upcoming, completed };
  }, [leads]);

  // 2. Filter the selected tab by search input and filters
  const currentTabLeads = React.useMemo(() => {
    const rawList = classifiedFollowUps[activeTab];
    return rawList.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search);
      const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [classifiedFollowUps, activeTab, search, sourceFilter]);

  // Actions
  const handleMarkComplete = async (leadId: string, name: string) => {
    try {
      const toastId = toast.loading(`Completing follow-up for ${name}...`);
      // Update DB to clear nextFollowUp date
      await editLead(leadId, { nextFollowUp: '' });
      // Add transaction audit note
      await addNoteToLead(leadId, 'Follow-up marked as completed.');
      toast.success(`Follow-up for ${name} completed!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete follow-up.');
    }
  };

  const handleStartReschedule = (leadId: string, currentDate: string) => {
    setReschedulingId(leadId);
    setRescheduleDate(currentDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveReschedule = async (leadId: string, name: string) => {
    if (!rescheduleDate) {
      toast.error('Please select a valid date.');
      return;
    }
    try {
      const toastId = toast.loading(`Rescheduling follow-up for ${name}...`);
      await editLead(leadId, { nextFollowUp: rescheduleDate });
      await addNoteToLead(leadId, `Follow-up rescheduled to ${formatDate(rescheduleDate)}.`);
      setReschedulingId(null);
      toast.success(`Follow-up for ${name} rescheduled successfully!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to reschedule.');
    }
  };

  // Tab count labels helper
  const getTabBadge = (tab: FollowUpTab) => {
    const list = classifiedFollowUps[tab];
    if (list.length === 0) return null;
    return (
      <Badge
        variant="secondary"
        className={cn(
          "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold",
          tab === 'overdue' && "bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
          tab === 'today' && "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400",
          tab === 'upcoming' && "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
        )}
      >
        {list.length}
      </Badge>
    );
  };

  // Get tab status description
  const getTabDescription = () => {
    switch (activeTab) {
      case 'overdue':
        return 'Follow-ups that were scheduled for past days and require immediate action.';
      case 'today':
        return 'Follow-ups scheduled for today. Complete or reschedule them by end of day.';
      case 'upcoming':
        return 'Follow-ups scheduled for future dates. Stay ahead of your sales pipeline.';
      case 'completed':
        return 'Closed clients (Won/Lost) or contacts without a pending follow-up date.';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-10 w-48 bg-slate-100 dark:bg-zinc-900 rounded-md" />
        <div className="h-28 w-full bg-slate-100 dark:bg-zinc-900 rounded-xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-indigo-500" />
          Follow-up Scheduler
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Manage reminder schedules, perform direct dial-outs, and keep leads moving forward.
        </p>
      </div>

      {/* Tabs list custom controller */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex flex-wrap gap-2.5">
        {(['overdue', 'today', 'upcoming', 'completed'] as FollowUpTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setReschedulingId(null);
            }}
            className={cn(
              "pb-3.5 pt-1.5 px-3 text-xs font-bold border-b-2 -mb-[2px] transition-all duration-200 cursor-pointer flex items-center capitalize",
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:border-zinc-200 dark:text-zinc-200"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {tab === 'today' ? 'Due Today' : tab}
            {getTabBadge(tab)}
          </button>
        ))}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full bg-slate-50/50 dark:bg-zinc-900/10 border border-slate-100 dark:border-zinc-800/40 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by client name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9.5 text-xs bg-white dark:bg-zinc-950"
          />
        </div>
        
        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-hidden"
          >
            <option value="All">All Sources</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Google">Google</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 px-1">
          {getTabDescription()}
        </div>

        {currentTabLeads.length === 0 ? (
          <Card className="glass-card border-none premium-shadow py-14 flex flex-col items-center justify-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center border border-slate-100 dark:border-zinc-800">
              <Calendar className="h-6 w-6 text-slate-400 dark:text-zinc-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-300">No scheduling records found</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm px-4">
                No follow-ups match this status tab or filter query parameters.
              </p>
            </div>
            {activeTab !== 'completed' && (
              <Link href="/leads">
                <Button size="xs" className="gap-1 text-xs font-semibold mt-1">
                  <Plus className="h-3.5 w-3.5" />
                  Select Lead to Schedule
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {currentTabLeads.map((lead) => {
              const tabStatus = getFollowUpStatus(lead.nextFollowUp);
              const isRescheduling = reschedulingId === lead.id;

              return (
                <Card
                  key={lead.id}
                  className={cn(
                    "glass-card border-none hover-lift premium-shadow transition-all duration-200",
                    activeTab === 'overdue' && "border-l-3 border-l-rose-500",
                    activeTab === 'today' && "border-l-3 border-l-amber-500",
                    activeTab === 'upcoming' && "border-l-3 border-l-indigo-500",
                    activeTab === 'completed' && "border-l-3 border-l-emerald-500"
                  )}
                >
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Info details */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 truncate flex items-center gap-1.5"
                        >
                          <User className="h-4 w-4 text-slate-400 shrink-0" />
                          {lead.name}
                        </Link>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {lead.source}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.2",
                            lead.status === 'Won' && "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
                            lead.status === 'Lost' && "bg-rose-500/10 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
                            lead.status === 'Negotiation' && "bg-amber-500/10 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                          )}
                        >
                          {lead.status}
                        </Badge>
                      </div>

                      {/* Contact metadata */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 truncate" />
                          {lead.email}
                        </span>
                        {lead.nextFollowUp && (
                          <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300 font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            Next: {formatDate(lead.nextFollowUp)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Inline rescheduling panel or quick buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                      {isRescheduling ? (
                        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-zinc-900/40 p-1.5 rounded-lg border border-slate-200/40 dark:border-zinc-800/40">
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs px-2 py-1 rounded-md focus:outline-hidden"
                          />
                          <Button
                            size="xs"
                            onClick={() => handleSaveReschedule(lead.id, lead.name)}
                            className="h-7 text-xs font-semibold"
                          >
                            Save
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setReschedulingId(null)}
                            className="h-7 text-xs font-semibold"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Direct Quick Dial/Email buttons */}
                          <a
                            href={`tel:${lead.phone}`}
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                              "h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900"
                            )}
                            title="Call Client"
                          >
                            <Phone className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                          </a>
                          
                          <a
                            href={`mailto:${lead.email}`}
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                              "h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900"
                            )}
                            title="Email Client"
                          >
                            <Mail className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
                          </a>

                          {/* Scheduler state buttons */}
                          {activeTab !== 'completed' && (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleStartReschedule(lead.id, lead.nextFollowUp || '')}
                                className="text-[11px] font-bold border-slate-200/80 hover:bg-slate-50 dark:border-zinc-850 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 cursor-pointer"
                              >
                                Reschedule
                              </Button>

                              <Button
                                size="xs"
                                onClick={() => handleMarkComplete(lead.id, lead.name)}
                                className="text-[11px] font-bold gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Done
                              </Button>
                            </>
                          )}
                          
                          <Link href={`/leads/${lead.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), "h-8 w-8 rounded-lg")}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
