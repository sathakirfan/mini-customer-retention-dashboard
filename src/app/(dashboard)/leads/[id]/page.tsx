'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLead } from '@/hooks/useLead';
import { LeadFormDialog } from '@/components/leads/lead-form';
import { formatDate, formatDateTime } from '@/utils/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Tag,
  Clock,
  Pencil,
  AlertCircle,
  Trash2
} from 'lucide-react';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap Next.js 15 dynamic params promise using React.use()
  const { id: leadId } = React.use(params);
  const { lead, isLoading, addNote, updateLeadProfile, removeLeadById } = useLead(leadId);

  const router = useRouter();

  // Local UI States
  const [noteContent, setNoteContent] = React.useState('');
  const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Negotiation states
  const [localCounterOffer, setLocalCounterOffer] = React.useState('');
  const [isNegotiating, setIsNegotiating] = React.useState(false);

  React.useEffect(() => {
    if (lead) {
      const timer = setTimeout(() => {
        setLocalCounterOffer(lead.counterOffer ? String(lead.counterOffer) : '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [lead]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <Badge className="bg-slate-100/80 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300 border-slate-200/50 dark:border-zinc-700/50 hover:bg-slate-100 font-medium px-2.5 py-0.5 rounded-full shadow-xs">New</Badge>;
      case 'Contacted':
        return <Badge className="bg-indigo-50/80 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30 hover:bg-indigo-50 font-medium px-2.5 py-0.5 rounded-full shadow-xs">Contacted</Badge>;
      case 'Negotiation':
        return <Badge className="bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-450 border-amber-100/50 dark:border-amber-900/30 hover:bg-amber-50 font-medium px-2.5 py-0.5 rounded-full shadow-xs">Negotiation</Badge>;
      case 'Won':
        return <Badge className="bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30 hover:bg-emerald-50 font-medium px-2.5 py-0.5 rounded-full shadow-xs">Won</Badge>;
      case 'Lost':
        return <Badge className="bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-50 font-medium px-2.5 py-0.5 rounded-full shadow-xs">Lost</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await addNote(noteContent.trim());
      setNoteContent('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!lead || !localCounterOffer.trim()) return;
    const offerValue = Number(localCounterOffer);
    if (isNaN(offerValue) || offerValue <= 0) return;

    setIsNegotiating(true);
    try {
      await addNote(`Negotiation Accept: Owner accepted client's counter-offer of ₹${offerValue.toLocaleString('en-IN')}. (Base target price: ₹${lead.expectedRevenue.toLocaleString('en-IN')})`);
      await updateLeadProfile({
        expectedRevenue: offerValue,
        counterOffer: offerValue,
        counterOfferStatus: 'Accepted',
        status: 'Won'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!lead || !localCounterOffer.trim()) return;
    const offerValue = Number(localCounterOffer);
    if (isNaN(offerValue) || offerValue <= 0) return;

    setIsNegotiating(true);
    try {
      await addNote(`Negotiation Reject: Owner rejected client's counter-offer of ₹${offerValue.toLocaleString('en-IN')}. Continuing negotiation at target price ₹${lead.expectedRevenue.toLocaleString('en-IN')}.`);
      await updateLeadProfile({
        counterOffer: offerValue,
        counterOfferStatus: 'Rejected'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${lead.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await removeLeadById();
      router.push('/leads');
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
          <span className="text-sm text-slate-500 font-medium">Loading lead details...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Lead Not Found</h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm text-center">
          The lead you are trying to view does not exist or may have been deleted.
        </p>
        <Link
          href="/leads"
          className={buttonVariants({ variant: 'outline', className: 'gap-2' })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-3 w-full pb-1">
        <Link
          href="/leads"
          className={buttonVariants({
            variant: 'ghost',
            className: 'pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 gap-2 text-sm font-medium',
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden xs:inline">Back to Leads Directory</span>
          <span className="xs:hidden">Back</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleDeleteLead}
            disabled={isDeleting}
            size="sm"
            variant="outline"
            className="gap-1.5 font-medium border-rose-200/60 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </Button>
          <Button onClick={() => setIsEditOpen(true)} size="sm" className="gap-1.5 font-medium shrink-0">
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Profile</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Lead Information Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card premium-shadow overflow-hidden border-none hover-lift glow-primary">
            <CardHeader className="bg-slate-100/30 dark:bg-zinc-900/10 border-b border-slate-200/30 dark:border-zinc-800/30">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-extrabold shadow-md shadow-indigo-500/15">
                  {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-zinc-50">{lead.name}</CardTitle>
                  <CardDescription className="text-xs pt-0.5">{getStatusBadge(lead.status)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Contact Details */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Contact Information</h4>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-300">
                  <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${lead.email}`} className="hover:underline truncate font-medium">{lead.email}</a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-300">
                  <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <a href={`tel:${lead.phone}`} className="hover:underline font-medium">{lead.phone}</a>
                </div>
              </div>

              <hr className="border-slate-100/50 dark:border-zinc-800/50" />

              {/* Deal parameters */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Deal Characteristics</h4>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-300">
                  <IndianRupee className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium">
                    Expected Revenue:{' '}
                    <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                      ₹{lead.expectedRevenue.toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-300">
                  <Tag className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium">Lead Source: <span className="font-bold text-indigo-600 dark:text-indigo-400">{lead.source}</span></span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-zinc-300">
                  <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <span className="font-medium">
                    Next Follow-Up:{' '}
                    <span className="font-bold text-slate-900 dark:text-zinc-100">
                      {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not scheduled'}
                    </span>
                  </span>
                </div>
              </div>

              <hr className="border-slate-100/50 dark:border-zinc-800/50" />

              {/* Internal Metadata */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-400 font-medium">
                  <span>Created:</span>
                  <span className="text-slate-600 dark:text-zinc-300 font-semibold">{formatDate(lead.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-400 font-medium">
                  <span>Last Modified:</span>
                  <span className="text-slate-600 dark:text-zinc-300 font-semibold">{formatDate(lead.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Negotiation Control Panel */}
          {lead.status === 'Negotiation' && (
            <Card className="glass-card premium-shadow overflow-hidden border-none hover-lift glow-primary">
              <CardHeader className="bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Tag className="h-4 w-4" />
                  Negotiation Control Hub
                </CardTitle>
                <CardDescription className="text-xs">
                  Review client counter-offers and decide to Accept (Ok) or Reject (Not Ok).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    <span>Base Asked Price:</span>
                    <span className="font-extrabold text-slate-900 dark:text-zinc-100">₹{lead.expectedRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {lead.counterOfferStatus === 'Accepted' ? (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center space-y-1">
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">Counter-Offer Accepted!</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                      Finalized deal value: ₹{lead.counterOffer?.toLocaleString('en-IN') || lead.expectedRevenue}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    {lead.counterOfferStatus === 'Rejected' && (
                      <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-center">
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Previous offer (₹{lead.counterOffer?.toLocaleString('en-IN')}) was Rejected</p>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="counterOffer" className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">Client Offer (₹)</Label>
                      <Input
                        id="counterOffer"
                        type="number"
                        placeholder="e.g. 3500"
                        value={localCounterOffer}
                        onChange={(e) => setLocalCounterOffer(e.target.value)}
                        className="bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200/60 dark:border-zinc-800/60"
                        disabled={isNegotiating}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        size="sm"
                        onClick={handleAcceptOffer}
                        disabled={!localCounterOffer || isNegotiating}
                        className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold shadow-xs hover:shadow-sm cursor-pointer transition-all duration-200"
                      >
                        Accept (Ok)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRejectOffer}
                        disabled={!localCounterOffer || isNegotiating}
                        className="border-rose-200/60 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/40 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer transition-all duration-200"
                      >
                        Reject (Not Ok)
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Timeline & Notes Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card premium-shadow border-none">
            <CardHeader className="border-b border-slate-100/50 dark:border-zinc-800/50">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-955 dark:text-zinc-50">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                Activity Feed & Client History
              </CardTitle>
              <CardDescription className="text-slate-400 dark:text-zinc-400">
                Chronological list of follow-ups, phone calls, and negotiations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Form to Add Notes */}
              <form onSubmit={handleAddNoteSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Textarea
                    placeholder="Type client update note here... (e.g. 'Spoke to Jane. Emailed quote. Scheduled meeting next Tuesday.')"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="resize-none bg-slate-50/50 dark:bg-zinc-900/30 focus:bg-white dark:focus:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/60"
                    disabled={isSubmittingNote}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={isSubmittingNote || !noteContent.trim()} className="gap-1.5 font-bold cursor-pointer shadow-md shadow-indigo-500/10 hover:shadow-lg">
                    {isSubmittingNote ? (
                      <>
                        <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Log Update
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <hr className="border-slate-100/50 dark:border-zinc-800/50" />

              {/* Chronological List */}
              <div className="space-y-5">
                {!lead.notes || lead.notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-1.5">
                    <Clock className="h-8 w-8 text-slate-200 dark:text-zinc-800" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">No updates logged yet</p>
                    <p className="text-xs max-w-xs">
                      Keep a clean business audit trail by logging summaries of calls and meetings above.
                    </p>
                  </div>
                ) : (
                  <div className="relative border-l border-indigo-100/40 dark:border-zinc-800/40 pl-6 ml-3 space-y-6">
                    {/* Reverse sort notes so latest is on top */}
                    {[...(lead.notes || [])]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((note) => (
                        <div key={note.id} className="relative group">
                          {/* Dot marker */}
                          <div className="absolute -left-[32px] top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-950 text-white shadow-md">
                            <Clock className="h-2.5 w-2.5" />
                          </div>
                          
                          {/* Note Card */}
                          <div className="rounded-xl border border-slate-200/45 dark:border-zinc-800/40 p-4.5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 bg-white/40 hover:bg-white/80 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/50 transition-all duration-200 shadow-xs">
                            <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-medium">
                              {note.content}
                            </p>
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-400 font-semibold">
                              <span>Log entry on</span>
                              <span className="text-slate-500 dark:text-zinc-300 font-bold">{formatDateTime(note.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <LeadFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        leadToEdit={lead}
      />
    </div>
  );
}
