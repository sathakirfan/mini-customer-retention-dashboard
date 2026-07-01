'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Lead, LeadSource, LeadStatus } from '@/types';
import { useLeads } from '@/hooks/useLeads';
import { LeadFormDialog } from './lead-form';
import { formatDate, getFollowUpStatus } from '@/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Database,
  Copy
} from 'lucide-react';
import { seedDatabase } from '@/services/leadService';
import { toast } from 'sonner';

export function LeadTable() {
  const {
    leads,
    paginatedLeads,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    totalPages,
    removeLead,
    duplicateLead,
  } = useLeads();

  // Debounced search - local state syncs to hook with 300ms delay
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, [setSearchQuery]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Local Modal States
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    const toastId = toast.loading('Seeding database with sample leads...');
    try {
      const success = await seedDatabase(true);
      if (success) {
        toast.success('Successfully loaded sample leads!', { id: toastId });
      } else {
        toast.error('Failed to seed database. Check your console logs.', { id: toastId });
      }
    } catch (error) {
      toast.error('An unexpected error occurred.', { id: toastId });
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  // Status Badge Colors (OKLCH mapping translated to Tailwind classes)
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return <Badge className="bg-slate-100/80 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300 border-slate-200/50 dark:border-zinc-700/50 hover:bg-slate-100 font-semibold px-2.5 py-0.5 rounded-full shadow-xs">New</Badge>;
      case 'Contacted':
        return <Badge className="bg-indigo-50/80 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30 hover:bg-indigo-50 font-semibold px-2.5 py-0.5 rounded-full shadow-xs">Contacted</Badge>;
      case 'Negotiation':
        return <Badge className="bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30 hover:bg-amber-50 font-semibold px-2.5 py-0.5 rounded-full shadow-xs">Negotiation</Badge>;
      case 'Won':
        return <Badge className="bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30 hover:bg-emerald-50 font-semibold px-2.5 py-0.5 rounded-full shadow-xs">Won</Badge>;
      case 'Lost':
        return <Badge className="bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-50 font-semibold px-2.5 py-0.5 rounded-full shadow-xs">Lost</Badge>;
    }
  };

  // Follow-up Highlight
  const getFollowUpBadge = (lead: Lead) => {
    if (lead.status === 'Won' || lead.status === 'Lost' || !lead.nextFollowUp) {
      return <span className="text-slate-400 text-xs">-</span>;
    }

    const status = getFollowUpStatus(lead.nextFollowUp);
    const dateFormatted = formatDate(lead.nextFollowUp);

    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {dateFormatted} (Overdue)
          </span>
        );
      case 'today':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Calendar className="h-3.5 w-3.5" />
            {dateFormatted} (Today)
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            {dateFormatted}
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">-</span>;
    }
  };

  // Handle lead deletion
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await removeLead(leadToDelete.id);
      setLeadToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort toggle handler
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search with debounce */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-zinc-400" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-9 bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60 focus:bg-white dark:focus:bg-zinc-950"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as LeadStatus | 'All')}
            >
              <SelectTrigger className="w-[130px] bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950">
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">Source:</span>
            <Select
              value={sourceFilter}
              onValueChange={(val) => setSourceFilter(val as LeadSource | 'All')}
            >
              <SelectTrigger className="w-[130px] bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950">
                <SelectItem value="All">All Sources</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="glass-card premium-shadow rounded-xl border-none overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader className="bg-slate-100/50 dark:bg-zinc-900/30 border-b border-slate-200/50 dark:border-zinc-800/30 sticky top-0 z-10">
            <TableRow>
              <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Name
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-zinc-300">Contact</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-zinc-300">Source</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-zinc-300">Status</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-zinc-300 text-right">
                <button
                  onClick={() => handleSort('expectedRevenue')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors ml-auto"
                >
                  Expected Revenue
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-zinc-300">
                <button
                  onClick={() => handleSort('nextFollowUp')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Follow-Up Date
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><div className="h-4 w-32 animate-pulse rounded bg-slate-100" /></TableCell>
                  <TableCell><div className="h-4 w-28 animate-pulse rounded bg-slate-100" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-slate-100" /></TableCell>
                  <TableCell><div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse rounded bg-slate-100 ml-auto" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-slate-100" /></TableCell>
                  <TableCell><div className="h-6 w-6 animate-pulse rounded bg-slate-100" /></TableCell>
                </TableRow>
              ))
            ) : paginatedLeads.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 max-w-sm mx-auto">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 dark:bg-zinc-900 dark:border-zinc-800">
                        <Database className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm dark:text-zinc-200">Your CRM Database is Empty</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-400 mb-3">
                        Get started by creating a new lead manually, or load pre-populated mockup leads to explore the CRM insights instantly.
                      </p>
                      <Button
                        onClick={handleSeedData}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 font-medium border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        disabled={isSeeding}
                      >
                        {isSeeding ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading mockups...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            Seed Demo Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-800 text-sm dark:text-zinc-200">No leads found</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-400 max-w-[280px]">
                        Try adjusting your search keywords, status filters, or create a new lead to start.
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 border-b border-slate-100/50 dark:border-zinc-800/50 transition-colors">
                <TableCell className="font-bold text-slate-800 dark:text-zinc-200">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {lead.name}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-500 dark:text-zinc-400 text-xs">
                  <div className="font-semibold text-slate-600 dark:text-zinc-300">{lead.phone}</div>
                  <div>{lead.email}</div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{lead.source}</TableCell>
                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                <TableCell className="text-right font-bold text-slate-900 dark:text-zinc-100">
                  ₹{lead.expectedRevenue.toLocaleString('en-IN')}
                </TableCell>
                <TableCell>{getFollowUpBadge(lead)}</TableCell>
                <TableCell>
                  {/* Action Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border-slate-200/80 dark:border-zinc-800/80">
                      <DropdownMenuItem className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 cursor-pointer">
                        <Link href={`/leads/${lead.id}`} className="flex items-center gap-2 w-full">
                          <Eye className="h-4 w-4 text-indigo-500" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLeadToEdit(lead)}
                        className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 text-amber-500" />
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => duplicateLead(lead.id)}
                        className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 cursor-pointer"
                      >
                        <Copy className="h-4 w-4 text-indigo-500" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setLeadToDelete(lead)}
                        className="flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {leads.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100/50 dark:border-zinc-800/50 px-6 py-4 bg-slate-50/30 dark:bg-zinc-900/10">
          <span className="text-xs text-slate-400 dark:text-zinc-400 font-medium">
            Showing Page <span className="font-semibold text-slate-700 dark:text-zinc-300">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-700 dark:text-zinc-300">{totalPages}</span> ({leads.length}{' '}
            leads total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white/70 dark:bg-zinc-950/50 border-slate-200/60 dark:border-zinc-800/60"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      </div>

      {/* Edit Form Dialog Overlay */}
      <LeadFormDialog
        isOpen={leadToEdit !== null}
        onClose={() => setLeadToEdit(null)}
        leadToEdit={leadToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={leadToDelete !== null} onOpenChange={() => setLeadToDelete(null)}>
        <DialogContent className="sm:max-w-[420px] border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Sales Lead?
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-500">
              Are you sure you want to delete the lead profile for{' '}
              <span className="font-semibold text-slate-800">
                {leadToDelete?.name || 'this client'}
              </span>
              ? This action is permanent and cannot be undone. All notes and follow-up data will be
              lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setLeadToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
