'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Building2,
  Bell,
  Palette,
  Database,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle,
  Download,
  Upload,
  FileText,
  AlertCircle
} from 'lucide-react';
import { seedDatabase } from '@/services/leadService';
import { useLeads } from '@/hooks/useLeads';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export';
import { parseCSV } from '@/utils/import';

interface BusinessSettings {
  businessName: string;
  ownerName: string;
  category: string;
  currency: string;
  alertsEnabled: boolean;
  dailyDigestEnabled: boolean;
  transparencyMode: 'glass' | 'solid';
}

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'LocalPulse Studio',
  ownerName: 'Admin Owner',
  category: 'Photography & Media',
  currency: '₹',
  alertsEnabled: true,
  dailyDigestEnabled: false,
  transparencyMode: 'glass',
};

const SETTINGS_STORAGE_KEY = 'localpulse_crm_settings';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  
  // Local Settings States
  const [settings, setSettings] = React.useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResettingDb, setIsResettingDb] = React.useState(false);
  const [isPurgingDb, setIsPurgingDb] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [importErrors, setImportErrors] = React.useState<string[]>([]);
  const [importPreview, setImportPreview] = React.useState<{name: string; email: string; status: string}[]>([]);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const { leads } = useLeads();

  // Load from LocalStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const timer = setTimeout(() => {
        if (stored) {
          try {
            setSettings(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to load settings', e);
          }
        }
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      
      // Dispatch event to notify other layout parts (if needed)
      window.dispatchEvent(new Event('localpulse-settings-updated'));
      
      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Seed / Reset Demo Leads
  const handleResetLeads = async () => {
    setIsResettingDb(true);
    const toastId = toast.loading('Re-seeding database...');
    try {
      await seedDatabase(true);
      toast.success('Database re-seeded with 10 demo leads!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to seed database.', { id: toastId });
    } finally {
      setIsResettingDb(false);
    }
  };

  // Purge/Clear Leads database
  const handlePurgeLeads = async () => {
    if (!confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) return;
    
    setIsPurgingDb(true);
    const toastId = toast.loading('Purging leads database...');
    
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    try {
      localStorage.setItem('hyperlocal_crm_leads', JSON.stringify([]));
      window.dispatchEvent(new Event('local-leads-updated'));
      toast.success('Database successfully cleared.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to purge database.', { id: toastId });
    } finally {
      setIsPurgingDb(false);
    }
  };

  const updateSetting = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      exportToCSV(leads, `crm_leads_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`${leads.length} leads exported as CSV.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      exportToExcel(leads, `crm_leads_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`${leads.length} leads exported for Excel.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    exportToPDF(leads, 'CRM Leads Database Report');
    toast.success('PDF report opened in new tab. Print or Save it.');
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportErrors([]);
    setImportPreview([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
      } else {
        setImportPreview(result.data.slice(0, 5).map(l => ({ name: l.name, email: l.email, status: l.status })));
        toast.success(`${result.data.length} valid rows detected. Review the preview below.`);
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span className="text-sm text-slate-500 font-medium">Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Main Grid: Business Info & Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-2 space-y-6">
            <Card className="glass-card premium-shadow border-none">
              <CardHeader className="border-b border-slate-100/50 dark:border-zinc-900/50 bg-slate-55/20 dark:bg-zinc-900/10">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Business Profile Settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure details that customize the system workspace and currencies.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={settings.businessName}
                      onChange={(e) => updateSetting('businessName', e.target.value)}
                      className="bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200/60 dark:border-zinc-800/60"
                      required
                    />
                  </div>

                  {/* Owner Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={settings.ownerName}
                      onChange={(e) => updateSetting('ownerName', e.target.value)}
                      className="bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200/60 dark:border-zinc-800/60"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Business Category</Label>
                    <Input
                      id="category"
                      value={settings.category}
                      onChange={(e) => updateSetting('category', e.target.value)}
                      className="bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200/60 dark:border-zinc-800/60"
                    />
                  </div>

                  {/* Currency Symbol */}
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Currency Code / Symbol</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => updateSetting('currency', e.target.value)}
                      className="bg-slate-50/50 dark:bg-zinc-900/30 border-slate-200/60 dark:border-zinc-800/60"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification settings */}
            <Card className="glass-card premium-shadow border-none">
              <CardHeader className="border-b border-slate-100/50 dark:border-zinc-900/50 bg-slate-55/20 dark:bg-zinc-900/10">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <Bell className="h-5 w-5 text-indigo-500" />
                  Notifications & Reminders
                </CardTitle>
                <CardDescription className="text-xs">
                  Control how alerts and follow-up reminders are prompted inside the console.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Follow up alerts */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold cursor-pointer text-slate-800 dark:text-zinc-200" htmlFor="alertsEnabled">
                      Follow-up Reminder Alerts
                    </Label>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                      Display visual banners when client follow-up times are overdue.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="alertsEnabled"
                    checked={settings.alertsEnabled}
                    onChange={(e) => updateSetting('alertsEnabled', e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <hr className="border-slate-100 dark:border-zinc-900" />

                {/* Email digests */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold cursor-pointer text-slate-800 dark:text-zinc-200" htmlFor="dailyDigestEnabled">
                      Daily Conversion Digest
                    </Label>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                      Send daily summary metrics on pipeline conversion ratios to owner account.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="dailyDigestEnabled"
                    checked={settings.dailyDigestEnabled}
                    onChange={(e) => updateSetting('dailyDigestEnabled', e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Theme & Actions column */}
          <div className="md:col-span-1 space-y-6">
            {/* Theme Customization */}
            <Card className="glass-card premium-shadow border-none">
              <CardHeader className="border-b border-slate-100/50 dark:border-zinc-900/50 bg-slate-55/20 dark:bg-zinc-900/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <Palette className="h-4.5 w-4.5 text-indigo-500" />
                  Appearance Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Active Color Mode</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`py-2 px-3 rounded-lg border text-center cursor-pointer transition-all ${
                        theme === 'light'
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-zinc-900'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                      }`}
                    >
                      Light Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`py-2 px-3 rounded-lg border text-center cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'border-indigo-400 bg-indigo-950/20 text-indigo-400 border-indigo-500/50'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                      }`}
                    >
                      Dark Space
                    </button>
                  </div>
                </div>
                
                <hr className="border-slate-100 dark:border-zinc-900" />

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Glassmorphic Density</Label>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => updateSetting('transparencyMode', 'glass')}
                      className={`py-2 px-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                        settings.transparencyMode === 'glass'
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                      }`}
                    >
                      Sleek Glass
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('transparencyMode', 'solid')}
                      className={`py-2 px-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                        settings.transparencyMode === 'solid'
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-500'
                      }`}
                    >
                      Solid Panels
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Import / Export */}
            <Card className="glass-card premium-shadow border-none">
              <CardHeader className="border-b border-slate-100/50 dark:border-zinc-900/50 bg-slate-55/20 dark:bg-zinc-900/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Data Import &amp; Export
                </CardTitle>
                <CardDescription className="text-xs">Download your leads data or upload a CSV to import new leads.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Export buttons */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Export</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      disabled={isExporting || leads.length === 0}
                      className="inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Download className="h-4 w-4 text-indigo-500" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      disabled={isExporting || leads.length === 0}
                      className="inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Download className="h-4 w-4 text-emerald-500" />
                      Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      disabled={leads.length === 0}
                      className="inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <FileText className="h-4 w-4 text-rose-500" />
                      PDF
                    </button>
                  </div>
                  {leads.length === 0 && (
                    <p className="text-[10px] text-amber-500 mt-1 font-medium">Add leads first before exporting.</p>
                  )}
                </div>

                {/* Import CSV */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Import CSV</p>
                  <label className="flex items-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-indigo-400/50 px-4 py-3 transition-all group">
                    <Upload className="h-4 w-4 text-indigo-400 group-hover:text-indigo-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {importFile ? importFile.name : 'Click to select a .csv file'}
                    </span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportFileChange} />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Required columns: Name, Email, Phone, Source, Status, Expected Revenue</p>

                  {/* Validation Errors */}
                  {importErrors.length > 0 && (
                    <div className="mt-2 rounded-lg border border-rose-200/60 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Validation Errors
                      </div>
                      {importErrors.slice(0, 5).map((err, i) => (
                        <p key={i} className="text-[10px] text-rose-500 pl-5">{err}</p>
                      ))}
                    </div>
                  )}

                  {/* Import Preview Grid */}
                  {importPreview.length > 0 && (
                    <div className="mt-3 rounded-lg border border-emerald-200/60 bg-emerald-50/30 dark:bg-emerald-950/10 dark:border-emerald-900/30 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border-b border-emerald-200/40 dark:border-emerald-900/30">
                        <CheckCircle className="h-3 w-3" />
                        Preview: first {importPreview.length} rows detected
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-emerald-100/40 dark:bg-emerald-900/10">
                              <th className="text-left px-3 py-1.5 font-bold text-slate-600 dark:text-zinc-400">Name</th>
                              <th className="text-left px-3 py-1.5 font-bold text-slate-600 dark:text-zinc-400">Email</th>
                              <th className="text-left px-3 py-1.5 font-bold text-slate-600 dark:text-zinc-400">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.map((row, i) => (
                              <tr key={i} className="border-t border-emerald-100/40 dark:border-emerald-900/20">
                                <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-zinc-300">{row.name}</td>
                                <td className="px-3 py-1.5 text-slate-500 dark:text-zinc-400">{row.email}</td>
                                <td className="px-3 py-1.5 text-slate-500 dark:text-zinc-400">{row.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database maintenance */}
            <Card className="glass-card premium-shadow border-none border-l-4 border-l-rose-500">
              <CardHeader className="border-b border-slate-100/50 dark:border-zinc-900/50 bg-slate-55/20 dark:bg-zinc-900/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-455">
                  <Database className="h-4.5 w-4.5" />
                  Database Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Storage Adapter Active
                </div>

                <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-400 leading-normal">
                  Perform core storage actions. Seeding overrides current list with 10 mock entries. Purging wipes everything.
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetLeads}
                    disabled={isResettingDb || isPurgingDb}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-indigo-500 ${isResettingDb ? 'animate-spin' : ''}`} />
                    Seed Sample Leads
                  </button>
                  
                  <button
                    type="button"
                    onClick={handlePurgeLeads}
                    disabled={isResettingDb || isPurgingDb}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200/50 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-300 dark:border-rose-900/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    Wipe All Leads Data
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form footer submit */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200/40 dark:border-zinc-900/40 pt-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 gap-1.5 font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/15 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
