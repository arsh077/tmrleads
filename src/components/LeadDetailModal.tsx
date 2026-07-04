import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, CheckCircle, Clock, Trash2, Shield, AlertCircle, FileText, Send, Sparkles, Plus, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, Employee } from '../types';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  employees: Employee[];
  currentUser: 'admin' | string | null;
  actorName: string;
  onSave: (leadId: string, updates: Partial<Lead>) => Promise<boolean>;
  onDelete?: (leadId: string) => Promise<boolean>;
}

export function LeadDetailModal({ isOpen, onClose, lead, employees, currentUser, actorName, onSave, onDelete }: LeadDetailModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Lead['status']>('New');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'timeline'>('details');

  useEffect(() => {
    if (isOpen && lead) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setStatus(lead.status || 'New');
      setAssignedTo(lead.assignedTo || null);
      
      // Convert ISO string to datetime-local friendly format (YYYY-MM-DDThh:mm)
      if (lead.followUpDate) {
        try {
          const d = new Date(lead.followUpDate);
          // Adjust to local timezone format
          const pad = (num: number) => String(num).padStart(2, '0');
          const localString = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setFollowUpDate(localString);
        } catch {
          setFollowUpDate('');
        }
      } else {
        setFollowUpDate('');
      }
      
      setNotes(lead.notes || '');
      setActiveSubTab('details');
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const isAdmin = currentUser === 'admin';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Convert local datetime to ISO String
    let isoFollowUp: string | undefined = undefined;
    if (followUpDate) {
      isoFollowUp = new Date(followUpDate).toISOString();
    } else {
      isoFollowUp = ""; // Represent clear
    }

    const updates: Partial<Lead> & { actorName: string } = {
      name,
      phone,
      status,
      assignedTo,
      notes,
      followUpDate: isoFollowUp || undefined,
      actorName
    };

    const success = await onSave(lead.id, updates);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm(`Are you sure you want to delete ${lead.name}?`)) return;
    
    setIsDeleting(true);
    const success = await onDelete(lead.id);
    setIsDeleting(false);
    if (success) {
      onClose();
    }
  };

  const getAssigneeName = (id: string | null) => {
    if (!id) return 'Unassigned';
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Lead: {lead.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Created: {new Date(lead.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete Lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/20 dark:bg-slate-900/20 flex-shrink-0">
          <button
            onClick={() => setActiveSubTab('details')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'details'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Edit Details
          </button>
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'timeline'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> Audit Logs Timeline ({lead.timeline?.length || 0})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeSubTab === 'details' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Lead Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-sm transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-sm transition-all"
                  />
                </div>
              </div>

              {/* Status & Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Lead['status'])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold transition-all"
                  >
                    <option value="New">🔵 New</option>
                    <option value="Contacted">🟡 Contacted</option>
                    <option value="Closed">🟢 Closed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Assigned Representative
                  </label>
                  {isAdmin ? (
                    <select
                      value={assignedTo || ''}
                      onChange={(e) => setAssignedTo(e.target.value ? e.target.value : null)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold transition-all"
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-sm font-semibold">
                      👤 {getAssigneeName(assignedTo)}
                    </div>
                  )}
                </div>
              </div>

              {/* Follow up Reminder System */}
              <div className="space-y-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-950/50 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Next Follow-up Reminder
                  </label>
                  {followUpDate && (
                    <button
                      type="button"
                      onClick={() => setFollowUpDate('')}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                    >
                      Clear Reminder
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Select a date and time. Dashboard will automatically blink and flash call reminders so you don't miss this customer.
                </p>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/40 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-sm transition-all"
                />
              </div>

              {/* Notes Details */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lead Updates & Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discussed proposal, requested callback on Monday..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all"
                  rows={4}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Vertical Timeline logs flow */
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <AlertCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Complete historic trace of all edits made to this lead. Audit reports are logged automatically.
                </p>
              </div>

              {!lead.timeline || lead.timeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-55" />
                  <p className="text-xs font-semibold">No audit logs logged yet</p>
                  <p className="text-[11px] opacity-80 mt-1">Actions will be tracked once updates are made.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-indigo-100 dark:border-indigo-950 ml-3.5 pl-6 space-y-6 py-1">
                  {lead.timeline.map((entry) => (
                    <div key={entry.id} className="relative group">
                      {/* Circle Dot marker */}
                      <span className="absolute -left-[31px] top-1 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <Clock className="w-2.5 h-2.5" />
                      </span>
                      
                      {/* Log Card */}
                      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {entry.action}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex-shrink-0 capitalize">
                            👤 {entry.user}
                          </span>
                        </div>
                        
                        {entry.notes && (
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 font-mono whitespace-pre-wrap">
                            {entry.notes}
                          </div>
                        )}
                        
                        <div className="mt-1.5 flex justify-end text-[9px] font-bold text-slate-400 dark:text-slate-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
