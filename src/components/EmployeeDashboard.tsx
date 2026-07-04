import React, { useState } from 'react';
import { Phone, CheckCircle2, Clock, Save, Edit3, LayoutList, Download } from 'lucide-react';
import { Employee, Lead } from '../types';

interface EmployeeDashboardProps {
  employee: Employee;
  leads: Lead[];
  employees?: Employee[];
  activeTab?: 'leads' | 'employees' | 'sheet' | 'settings';
  onSelectLead?: (lead: Lead) => void;
}

export function EmployeeDashboard({ employee, leads, employees = [], activeTab = 'leads', onSelectLead }: EmployeeDashboardProps) {
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const myLeads = leads.filter(l => l.assignedTo === employee.id);

  const exportMyLeadsToCSV = () => {
    const headers = 'ID,Name,Phone,Status,Notes,Follow-Up Date,Created At\n';
    const rows = myLeads.map(lead => {
      const escapedName = (lead.name || '').replace(/"/g, '""');
      const escapedPhone = (lead.phone || '').replace(/"/g, '""');
      const escapedNotes = (lead.notes || '').replace(/\n/g, ' ').replace(/"/g, '""');
      const escapedStatus = lead.status;
      const followUp = lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : '';
      const createdAt = new Date(lead.createdAt).toLocaleString();
      return `"${lead.id}","${escapedName}","${escapedPhone}","${escapedStatus}","${escapedNotes}","${followUp}","${createdAt}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `my_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  };

  const saveNotes = async (leadId: string) => {
    const notes = editingNotes[leadId];
    if (notes === undefined) return;
    
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    
    // Clear editing state to show saved notes
    setEditingNotes(prev => {
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
  };

  const startEditingNotes = (lead: Lead) => {
    setEditingNotes(prev => ({ ...prev, [lead.id]: lead.notes || '' }));
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return 'Unassigned';
    return employees.find(e => e.id === id)?.name || 'Unknown';
  };

  const stats = {
    total: myLeads.length,
    new: myLeads.filter(l => l.status === 'New').length,
    contacted: myLeads.filter(l => l.status === 'Contacted').length,
    closed: myLeads.filter(l => l.status === 'Closed').length
  };

  if (activeTab === 'sheet') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <LayoutList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Lead Tracking Sheet</h2>
            </div>
            <button
              onClick={() => {
                // Export all leads visible in tracking sheet
                const headers = 'ID,Name,Phone,Assigned Rep,Status,Notes,Follow-Up Date,Created At\n';
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
                link.setAttribute('download', `leads_tracking_sheet_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Tracking Sheet (CSV/Excel)
            </button>
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
                    <tr 
                      key={lead.id} 
                      onClick={() => onSelectLead && onSelectLead(lead)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${onSelectLead ? 'cursor-pointer' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          {lead.followUpDate && (
                            <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900 animate-pulse">
                              📅 Reminder
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{lead.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{getEmployeeName(lead.assignedTo)}</span>
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
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-2">{lead.notes}</p>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No notes added</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-xs whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                        {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Welcome, {employee.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Here are your assigned leads.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.new}</p>
            <p className="text-xs text-blue-600 dark:text-blue-300 font-medium uppercase">New</p>
          </div>
          <div className="text-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.contacted}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-300 font-medium uppercase">Contacted</p>
          </div>
          <div className="text-center px-4 py-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.closed}</p>
            <p className="text-xs text-green-600 dark:text-green-300 font-medium uppercase">Closed</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">My Queue</h3>
          {myLeads.length > 0 && (
            <button
              type="button"
              onClick={exportMyLeadsToCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export My Leads (CSV)
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {myLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p>You have no leads assigned yet. Relax!</p>
            </div>
          ) : (
            [...myLeads].sort((a,b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).map(lead => (
              <div key={lead.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectLead && onSelectLead(lead)}
                          className="text-left text-base font-bold text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <span>{lead.name}</span>
                          {lead.followUpDate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-900 animate-pulse">
                              📅 Follow-up
                            </span>
                          )}
                        </button>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${lead.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 
                            lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 
                            'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}
                        >
                          {lead.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectLead && onSelectLead(lead)}
                        className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded transition-all cursor-pointer"
                      >
                        Details & Timeline
                      </button>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm gap-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${lead.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">{lead.phone}</a>
                      </div>
                    )}
                    <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs gap-1 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{lead.updatedAt ? `Updated on ${new Date(lead.updatedAt).toLocaleString()}` : `Assigned on ${new Date(lead.createdAt).toLocaleString()}`}</span>
                    </div>
                  </div>
                  
                  {/* Notes Section */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Updates & Notes</h5>
                    {editingNotes[lead.id] !== undefined ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNotes[lead.id]}
                          onChange={(e) => setEditingNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                          placeholder="e.g. Called them today, deal is almost done..."
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNotes(lead.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Save Notes
                          </button>
                          <button
                            onClick={() => setEditingNotes(prev => { const next = {...prev}; delete next[lead.id]; return next; })}
                            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group flex justify-between items-start gap-4">
                        {lead.notes ? (
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap flex-1">{lead.notes}</p>
                        ) : (
                          <p className="text-sm text-slate-400 dark:text-slate-500 italic flex-1">No notes added yet.</p>
                        )}
                        <button
                          onClick={() => startEditingNotes(lead)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                          title="Edit Notes"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 lg:min-w-[140px] pt-2 lg:pt-0">
                  {lead.status !== 'New' && (
                    <button 
                      onClick={() => updateLeadStatus(lead.id, 'New')}
                      className="w-full px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Mark New
                    </button>
                  )}
                  {lead.status !== 'Contacted' && (
                    <button 
                      onClick={() => updateLeadStatus(lead.id, 'Contacted')}
                      className="w-full px-3 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                    >
                      Mark Contacted
                    </button>
                  )}
                  {lead.status !== 'Closed' && (
                    <button 
                      onClick={() => updateLeadStatus(lead.id, 'Closed')}
                      className="w-full px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-md hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                    >
                      Mark Closed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
