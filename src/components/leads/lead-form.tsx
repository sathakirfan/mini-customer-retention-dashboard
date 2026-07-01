'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lead, LeadSource, LeadStatus } from '@/types';
import { useLeads } from '@/hooks/useLeads';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, StickyNote } from 'lucide-react';

const leadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters'),
  source: z.enum(['Instagram', 'Facebook', 'WhatsApp', 'Google', 'Walk-in', 'Referral', 'Other'] as const),
  status: z.enum(['New', 'Contacted', 'Negotiation', 'Won', 'Lost'] as const),
  expectedRevenue: z.number().min(0, 'Revenue must be a positive number'),
  nextFollowUp: z.string().optional(),
  initialNote: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

export function LeadFormDialog({ isOpen, onClose, leadToEdit }: LeadFormDialogProps) {
  const { addLead, editLead, addNoteToLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      source: 'Instagram',
      status: 'New',
      expectedRevenue: 0,
      nextFollowUp: '',
      initialNote: '',
    },
  });

  const currentStatus = watch('status');
  const currentSource = watch('source');

  useEffect(() => {
    if (leadToEdit) {
      reset({
        name: leadToEdit.name,
        email: leadToEdit.email,
        phone: leadToEdit.phone,
        source: leadToEdit.source,
        status: leadToEdit.status,
        expectedRevenue: leadToEdit.expectedRevenue,
        nextFollowUp: leadToEdit.nextFollowUp || '',
        initialNote: '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        source: 'Instagram',
        status: 'New',
        expectedRevenue: 0,
        nextFollowUp: '',
        initialNote: '',
      });
    }
  }, [leadToEdit, reset, isOpen]);

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    try {
      const { initialNote, ...corePayload } = data;
      const payload = { ...corePayload, nextFollowUp: data.nextFollowUp || '' };

      if (leadToEdit) {
        await editLead(leadToEdit.id, payload);
        // If an additional note was added during edit, append it as a log entry
        if (initialNote && initialNote.trim()) {
          await addNoteToLead(leadToEdit.id, initialNote.trim());
        }
      } else {
        // Create lead then add initial note separately
        const newLead = await addLead(payload);
        if (newLead && initialNote && initialNote.trim()) {
          await addNoteToLead(newLead.id, initialNote.trim());
        }
      }
      onClose();
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] max-w-[520px] max-h-[90vh] overflow-y-auto border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {leadToEdit ? 'Edit Lead Profile' : 'Add New Lead'}
          </DialogTitle>
          <DialogDescription>
            {leadToEdit
              ? 'Update the lead details below. Optionally add a note to the audit log.'
              : 'Enter details for the new sales lead. All fields marked * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Ravi Shankar"
                {...register('name')}
                disabled={isSubmitting}
                className="bg-slate-50/50 dark:bg-zinc-900/30"
              />
              {errors.name && (
                <p className="text-xs font-medium text-rose-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ravi@example.com"
                {...register('email')}
                disabled={isSubmitting}
                className="bg-slate-50/50 dark:bg-zinc-900/30"
              />
              {errors.email && (
                <p className="text-xs font-medium text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                {...register('phone')}
                disabled={isSubmitting}
                className="bg-slate-50/50 dark:bg-zinc-900/30"
              />
              {errors.phone && (
                <p className="text-xs font-medium text-rose-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Lead Source */}
            <div className="space-y-1.5">
              <Label htmlFor="source">Lead Source *</Label>
              <Select
                value={currentSource}
                onValueChange={(val) => setValue('source', val as LeadSource)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="source" className="bg-slate-50/50 dark:bg-zinc-900/30">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950">
                  <SelectItem value="Instagram">📸 Instagram</SelectItem>
                  <SelectItem value="Facebook">👍 Facebook</SelectItem>
                  <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                  <SelectItem value="Google">🔍 Google</SelectItem>
                  <SelectItem value="Walk-in">🚶 Walk-in</SelectItem>
                  <SelectItem value="Referral">🤝 Referral</SelectItem>
                  <SelectItem value="Other">📌 Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-xs font-medium text-rose-500">{errors.source.message}</p>
              )}
            </div>

            {/* Lead Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Pipeline Status *</Label>
              <Select
                value={currentStatus}
                onValueChange={(val) => setValue('status', val as LeadStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className="bg-slate-50/50 dark:bg-zinc-900/30">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950">
                  <SelectItem value="New">🆕 New</SelectItem>
                  <SelectItem value="Contacted">📞 Contacted</SelectItem>
                  <SelectItem value="Negotiation">🤝 Negotiation</SelectItem>
                  <SelectItem value="Won">✅ Won</SelectItem>
                  <SelectItem value="Lost">❌ Lost</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs font-medium text-rose-500">{errors.status.message}</p>
              )}
            </div>

            {/* Expected Revenue */}
            <div className="space-y-1.5">
              <Label htmlFor="expectedRevenue">
                {currentStatus === 'Negotiation' ? 'Negotiation Amount (₹)' : 'Expected Revenue (₹)'}
              </Label>
              <Input
                id="expectedRevenue"
                type="number"
                step="1"
                placeholder="50000"
                {...register('expectedRevenue', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="bg-slate-50/50 dark:bg-zinc-900/30"
              />
              {errors.expectedRevenue && (
                <p className="text-xs font-medium text-rose-500">
                  {errors.expectedRevenue.message}
                </p>
              )}
            </div>

            {/* Next Follow Up */}
            <div className="space-y-1.5">
              <Label htmlFor="nextFollowUp">Next Follow-Up Date</Label>
              <Input
                id="nextFollowUp"
                type="date"
                {...register('nextFollowUp')}
                disabled={isSubmitting}
                className="bg-slate-50/50 dark:bg-zinc-900/30"
              />
              {errors.nextFollowUp && (
                <p className="text-xs font-medium text-rose-500">{errors.nextFollowUp.message}</p>
              )}
            </div>

            {/* Notes / Initial Audit Note */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="initialNote" className="flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-slate-400" />
                {leadToEdit ? 'Add Note to Timeline' : 'Initial Note (Optional)'}
              </Label>
              <textarea
                id="initialNote"
                rows={2}
                placeholder={leadToEdit
                  ? 'Add a note about this update, e.g. "Status updated to Negotiation. Budget ₹80,000."'
                  : 'Add any opening context, e.g. "Interested in gold plan. Referred by Ajay."'}
                {...register('initialNote')}
                disabled={isSubmitting}
                className="w-full resize-none rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 px-3 py-2 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : leadToEdit ? (
                'Save Changes'
              ) : (
                'Create Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
