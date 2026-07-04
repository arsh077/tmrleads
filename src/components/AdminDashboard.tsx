import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ClipboardList, Trash2, Moon, Sun, LayoutList, CheckCircle2, Menu as MenuIcon, X, Home, Mail, User, Settings, Sparkles, Download, Upload } from 'lucide-react';
import { Employee, Lead } from '../types';
import { MenuItem, MenuContainer } from './ui/fluid-menu';

interface AdminDashboardProps {
  employees: Employee[];
  leads: Lead[];
  activeTab?: 'leads' | 'employees' | 'sheet' | 'settings';
  setActiveTab?: (tab: 'leads' | 'employees' | 'sheet' | 'settings') => void;
  theme?: 'light' | 'dark' | 'night';
  setTheme?: (theme: 'light' | 'dark' | 'night') => void;
  onSelectLead?: (lead: Lead) => void;
}

export function AdminDashboard({ 
  employees, 
  leads, 
  activeTab: activeTabProp, 
  setActiveTab: setActiveTabProp,
  theme: themeProp,
  setTheme: setThemeProp,
  onSelectLead
}: AdminDashboardProps) {
  const [activeTabInternal, setActiveTabInternal] = useState<'leads' | 'employees' | 'sheet' | 'settings'>('leads');
  const activeTab = activeTabProp !== undefined ? activeTabProp : activeTabInternal;
  const setActiveTab = setActiveTabProp !== undefined ? setActiveTabProp : setActiveTabInternal;
  
  // Theme state fallback
  const [themeInternal, setThemeInternal] = useState<'light' | 'dark' | 'night'>('light');
  const theme = themeProp !== undefined ? themeProp : themeInternal;
  const setTheme = setThemeProp !== undefined ? setThemeProp : setThemeInternal;

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('night');
    } else {
      setTheme('light');
    }
  };

  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newLoginId, setNewLoginId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [bulkLeads, setBulkLeads] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Screenshot upload and scanning states
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    extractedCount: number;
    createdCount: number;
    leads: { id: string; name: string; phone: string; assignedTo: string | null }[];
  } | null>(null);
  const [scanError, setScanError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      const promises = filesArray.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises)
        .then(base64Images => {
          setScreenshots(prev => [...prev, ...base64Images]);
          setScanError('');
        })
        .catch(() => {
          setScanError('Failed to read some files. Please try again.');
        });
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllScreenshots = () => {
    setScreenshots([]);
    setScanResult(null);
    setScanError('');
  };

  const handleScanScreenshots = async () => {
    if (screenshots.length === 0) return;
    setIsScanning(true);
    setScanError('');
    setScanResult(null);

    try {
      const res = await fetch('/api/leads/parse-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: screenshots })
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || 'Failed to scan screenshots. Ensure your API key is correctly configured.');
      } else {
        setScanResult(data);
        setScreenshots([]); // Clear files on success
      }
    } catch (err) {
      setScanError('Network or server error while scanning screenshots.');
    } finally {
      setIsScanning(false);
    }
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newEmployeeName.trim() || !newLoginId.trim() || !newPassword.trim()) {
      setErrorMsg('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEmployeeName, loginId: newLoginId, password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create employee');
      } else {
        setNewEmployeeName('');
        setNewLoginId('');
        setNewPassword('');
      }
    } catch (err) {
      setErrorMsg('Network error');
    }
    setLoading(false);
  };

  const toggleEmployeeActive = async (id: string, active: boolean) => {
    await fetch(`/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
  };

  const removeEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
  };

  const distributeLeads = async () => {
    if (!bulkLeads.trim()) return;
    setLoading(true);
    await fetch('/api/leads/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: bulkLeads })
    });
    setBulkLeads('');
    setLoading(false);
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return 'Unassigned';
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  const handleCSVImport = async (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return;

    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('name') || firstLineLower.includes('phone') || firstLineLower.includes('mobile') || firstLineLower.includes('note');
    if (hasHeader) {
      startIndex = 1;
    }

    const parsedLeads = [];
    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i];
      let cols = [];
      if (row.includes('\t')) {
        cols = row.split('\t');
      } else if (row.includes(';')) {
        cols = row.split(';');
      } else {
        // Simple comma split but support quotes optionally if they exist
        cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      }

      // Clean outer quotes if any
      const cleanCol = (val: string) => {
        if (!val) return '';
        let s = val.trim();
        if (s.startsWith('"') && s.endsWith('"')) {
          s = s.substring(1, s.length - 1);
        }
        return s.replace(/""/g, '"');
      };

      const name = cleanCol(cols[0] || '');
      const phone = cleanCol(cols[1] || '');
      const notes = cleanCol(cols[2] || '');
      const followUpDateRaw = cleanCol(cols[3] || '');

      if (!name && !phone) continue;

      let followUpDate: string | undefined = undefined;
      if (followUpDateRaw) {
        try {
          const parsedD = new Date(followUpDateRaw);
          if (!isNaN(parsedD.getTime())) {
            followUpDate = parsedD.toISOString();
          }
        } catch {}
      }

      parsedLeads.push({
        name,
        phone,
        notes,
        followUpDate
      });
    }

    if (parsedLeads.length === 0) {
      alert('No valid lead rows found to import.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/leads/bulk-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedLeads, actorName: 'Admin' })
      });
      if (res.ok) {
        alert(`Successfully imported ${parsedLeads.length} leads! 🎉`);
      } else {
        const errData = await res.json();
        alert(`Failed to import leads: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        await handleCSVImport(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadSampleCSV = () => {
    const headers = 'name,phone,notes,followUpDate\n';
    const row1 = 'Rajesh Kumar,9812345678,Interested in Study Visa,2026-07-05T10:30:00Z\n';
    const row2 = 'Simran Kaur,9876543210,Looking for Job Assistance,2026-07-06T15:00:00Z\n';
    
    const blob = new Blob([headers + row1 + row2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    const headers = 'ID,Name,Phone,Assigned To,Status,Notes,Follow-Up Date,Created At\n';
    const rows = leads.map(lead => {
      const repName = getEmployeeName(lead.assignedTo).replace(/"/g, '""');
      const escapedName = (lead.name || '').replace(/"/g, '""');
      const escapedPhone = (lead.phone || '').replace(/"/g, '""');
      const escapedNotes = (lead.notes || '').replace(/\n/g, ' ').replace(/"/g, '""');
      const escapedStatus = lead.status;
      const followUp = lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : '';
      const createdAt = new Date(lead.createdAt).toLocaleString();
      return `"${lead.id}","${escapedName}","${escapedPhone}","${repName}","${escapedStatus}","${escapedNotes}","${followUp}","${createdAt}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Tab: Leads */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Import & Distribute Leads</h2>
            </div>
            
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Manual Paste */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">1</span>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider">Option 1: Paste Text Form</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Paste names and phone numbers (one per line). The system will divide them evenly among all team members (even offline ones).
                </p>
                <textarea
                  value={bulkLeads}
                  onChange={(e) => setBulkLeads(e.target.value)}
                  placeholder="John Doe 9876543210&#10;Alice Smith 1234567890"
                  rows={6}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  disabled={loading}
                />
                <button
                  onClick={distributeLeads}
                  disabled={loading || !bulkLeads.trim()}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition-colors cursor-pointer text-sm"
                >
                  {loading ? 'Distributing...' : 'Distribute Leads Automatically'}
                </button>
              </div>

              {/* AI Screenshot Parser */}
              <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 pt-6 lg:pt-0 lg:pl-8">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-xs font-bold text-indigo-700 dark:text-indigo-400">2</span>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    Option 2: Screenshot AI Scanner
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 animate-pulse uppercase tracking-wider">Gemini 3.5</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload screenshots (WhatsApp chats, contacts, spreadsheets). Gemini AI will extract and distribute the leads!
                </p>

                {/* Dropzone Area */}
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-slate-50/50 dark:bg-slate-900/30 p-6 text-center cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isScanning}
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="flex justify-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Drag & drop images here or <span className="text-indigo-600 dark:text-indigo-400">browse files</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Supports PNG, JPG (Select multiple screenshots)</p>
                  </div>
                </div>

                {/* Previews */}
                {screenshots.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Pending Screenshots ({screenshots.length})
                      </span>
                      <button 
                        onClick={clearAllScreenshots}
                        className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {screenshots.map((src, i) => (
                        <div key={i} className="relative aspect-square border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden group">
                          <img src={src} alt="screenshot preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeScreenshot(i)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {scanError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs rounded-lg border border-rose-200 dark:border-rose-900/40">
                    {scanError}
                  </div>
                )}

                {/* Success Results Banner */}
                {scanResult && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 text-xs rounded-lg border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                    <p className="font-bold">✨ AI Scanning Successful!</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Successfully extracted <strong className="text-emerald-700 dark:text-emerald-300">{scanResult.extractedCount}</strong> leads from screenshots.
                      All leads have been automatically registered and distributed to active employees!
                    </p>
                    {scanResult.leads.length > 0 && (
                      <div className="max-h-24 overflow-y-auto border-t border-emerald-100 dark:border-emerald-900/50 pt-2 space-y-1 font-mono text-[10px]">
                        {scanResult.leads.map((l, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>👤 {l.name}</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{l.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Parser Action Button */}
                <button
                  onClick={handleScanScreenshots}
                  disabled={isScanning || screenshots.length === 0}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg disabled:opacity-50 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md shadow-indigo-500/10"
                >
                  {isScanning ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scanning with Gemini AI...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      Scan & Distribute {screenshots.length > 0 ? `(${screenshots.length} Screens)` : ''}
                    </>
                  )}
                </button>
              </div>

              {/* Option 3: Bulk CSV / Excel File Importer */}
              <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 pt-6 lg:pt-0 lg:pl-8">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-400">3</span>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    Option 3: Excel / CSV Importer
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload a standard `.csv` file. The leads will be automatically distributed evenly among all team members (even offline ones).
                </p>

                {/* CSV Dropzone / Input Area */}
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors bg-slate-50/50 dark:bg-slate-900/30 p-6 text-center cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="flex justify-center text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      <Upload className="w-10 h-10" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Drag & drop `.csv` here or <span className="text-emerald-600 dark:text-emerald-400 font-bold">browse files</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Supports comma-separated sheets (.csv)</p>
                  </div>
                </div>

                {/* Sample Template Downloader */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="w-full py-2 px-3 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">All Leads ({leads.length})</h2>
              <button
                type="button"
                onClick={exportToCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-bold text-xs cursor-pointer transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Export All Leads (CSV/Excel)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Phone</th>
                    <th className="px-6 py-3 font-semibold">Assigned To</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Date Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No leads in the system yet.</td>
                    </tr>
                  ) : (
                    [...leads].reverse().map(lead => (
                      <tr 
                        key={lead.id} 
                        onClick={() => onSelectLead && onSelectLead(lead)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${onSelectLead ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{lead.name}</span>
                          {lead.followUpDate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900 animate-pulse">
                              📅 Reminder
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono">{lead.phone || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium">
                            {getEmployeeName(lead.assignedTo)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${lead.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 
                              lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 
                              'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Employees */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Team Members</h2>
          </div>
          <div className="p-5 space-y-4">
            <form onSubmit={addEmployee} className="space-y-3">
              {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <input 
                  type="text" 
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Full Name (e.g. John Doe)"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <input 
                  type="text" 
                  value={newLoginId}
                  onChange={(e) => setNewLoginId(e.target.value)}
                  placeholder="Login ID (e.g. john123)"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password"
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !newEmployeeName.trim() || !newLoginId.trim() || !newPassword.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" /> Create
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 pt-4">
              {employees.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-3 text-center">No employees added yet.</p>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID: <span className="font-mono text-slate-700 dark:text-slate-300">{emp.loginId}</span> &bull; Leads: {emp.leadCount}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleEmployeeActive(emp.id, !emp.active)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          emp.active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {emp.active ? 'Active' : 'Inactive'}
                      </button>
                      <button 
                        onClick={() => removeEmployee(emp.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Employee Sheet */}
      {activeTab === 'sheet' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <LayoutList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Lead Tracking Sheet</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-semibold">Lead Details</th>
                  <th className="px-6 py-3 font-semibold">Assigned Rep</th>
                  <th className="px-6 py-3 font-semibold">Current Status</th>
                  <th className="px-6 py-3 font-semibold w-1/3">Employee Updates & Notes</th>
                  <th className="px-6 py-3 font-semibold text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No leads to track.</td>
                  </tr>
                ) : (
                  [...leads].sort((a,b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-white">{lead.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{lead.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{getEmployeeName(lead.assignedTo)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${lead.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 
                            lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 
                            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lead.notes ? (
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{lead.notes}</p>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No notes added</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs whitespace-nowrap">
                        {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Admin Settings</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  Application Theme Setup 🌗
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose a gorgeous personalized interface layout: Light Mode, Dark Slate, or deep space Night Mode.
                </p>
              </div>

              {/* Segmented Control Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme('night')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    theme === 'night'
                      ? 'bg-slate-950 text-purple-400 shadow-sm border border-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Night</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Fluid Menu for Admin Navigation */}
      <div className="fixed bottom-6 right-6 z-50">
        <MenuContainer>
          <MenuItem 
            icon={
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute transition-all duration-300 ease-in-out origin-center opacity-100 scale-100 rotate-0 [div[data-expanded=true]_&]:opacity-0 [div[data-expanded=true]_&]:scale-0 [div[data-expanded=true]_&]:rotate-180">
                  <MenuIcon size={24} strokeWidth={1.5} />
                </div>
                <div className="absolute transition-all duration-300 ease-in-out origin-center opacity-0 scale-0 -rotate-180 [div[data-expanded=true]_&]:opacity-100 [div[data-expanded=true]_&]:scale-100 [div[data-expanded=true]_&]:rotate-0">
                  <X size={24} strokeWidth={1.5} />
                </div>
              </div>
            } 
            title="Toggle Admin Menu"
          />
          <MenuItem 
            icon={<Home size={22} strokeWidth={1.5} />} 
            onClick={() => setActiveTab('leads')}
            title="Leads Queue"
            className={activeTab === 'leads' ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400' : ''}
          />
          <MenuItem 
            icon={<Mail size={22} strokeWidth={1.5} />} 
            onClick={() => setActiveTab('employees')}
            title="Manage Employees"
            className={activeTab === 'employees' ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400' : ''}
          />
          <MenuItem 
            icon={<User size={22} strokeWidth={1.5} />} 
            onClick={() => setActiveTab('sheet')}
            title="Employee Activity Sheet"
            className={activeTab === 'sheet' ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400' : ''}
          />
          <MenuItem 
            icon={
              theme === 'light' ? (
                <Moon size={22} strokeWidth={1.5} className="text-indigo-500" />
              ) : theme === 'dark' ? (
                <Sparkles size={22} strokeWidth={1.5} className="text-violet-400" />
              ) : (
                <Sun size={22} strokeWidth={1.5} className="text-amber-500" />
              )
            } 
            onClick={cycleTheme}
            title={`Cycle Theme (Current: ${theme})`}
            className={theme !== 'light' ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400' : ''}
          />
        </MenuContainer>
      </div>
    </div>
  );
}

