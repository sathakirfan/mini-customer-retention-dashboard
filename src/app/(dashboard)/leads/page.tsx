import { LeadTable } from '@/components/leads/lead-table';

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Leads Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Manage your customer database, check statuses, and track revenue pipeline in real-time.
          </p>
        </div>
      </div>

      <LeadTable />
    </div>
  );
}
