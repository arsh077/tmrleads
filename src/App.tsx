import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ShieldAlert, ClipboardList, LayoutList, LogOut, Moon, Sun, User, Scale, Sparkles, AlertCircle, Phone, Calendar, Clock, Volume2 } from 'lucide-react';
import { AppState, Lead } from './types';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AnimatedCharactersLoginPage } from './components/ui/animated-characters-login-page';
import NavHeader from './components/blocks/nav-header';
import { Sidebar, SidebarBody, SidebarLink } from './components/ui/sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { ProfileModal } from './components/ProfileModal';
import { LeadDetailModal } from './components/LeadDetailModal';

const Logo = () => {
  return (
    <div className="flex items-center gap-2 py-1.5 px-1 relative z-20">
      <div className="h-6 w-6 bg-indigo-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 flex items-center justify-center text-white">
        <Scale className="w-4 h-4" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-extrabold text-sm text-slate-900 dark:text-white whitespace-pre tracking-tight"
      >
        LSI PORTAL
      </motion.span>
    </div>
  );
};

const LogoIcon = () => {
  return (
    <div className="flex items-center justify-center py-1.5 relative z-20">
      <div className="h-6 w-6 bg-indigo-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0 flex items-center justify-center text-white">
        <Scale className="w-4 h-4" />
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>({ employees: [], leads: [] });
  const [currentUser, setCurrentUser] = useState<'admin' | string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'employees' | 'sheet' | 'settings'>('leads');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeReminders, setActiveReminders] = useState<Lead[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const handleSaveLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedLead = await res.json();
        // Sync state locally immediately
        setState(prev => ({
          ...prev,
          leads: prev.leads.map(l => l.id === leadId ? { ...l, ...updatedLead } : l)
        }));
        
        // Also update selectedLead if it is open
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, ...updatedLead });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save lead", err);
      return false;
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setState(prev => ({
          ...prev,
          leads: prev.leads.filter(l => l.id !== leadId)
        }));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(null);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to delete lead", err);
      return false;
    }
  };

  // Follow-up reminder checking effect
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const relevant = state.leads.filter(lead => {
        if (!lead.followUpDate || lead.status === 'Closed') return false;
        
        // Employees only see their own reminders
        if (currentUser !== 'admin' && lead.assignedTo !== currentUser) return false;

        const fDate = new Date(lead.followUpDate);
        // Time diff in minutes
        const diffMs = fDate.getTime() - now.getTime();
        const diffMins = diffMs / 60000;
        
        // Active when due or past due (up to 24 hours overdue), or within next 15 minutes
        return diffMins <= 15 && diffMins >= -1440;
      });
      
      setActiveReminders(relevant);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [state.leads, currentUser]);
  
  // Three-mode Theme State: 'light' | 'dark' | 'night'
  const [theme, setThemeState] = useState<'light' | 'dark' | 'night'>(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'night';
    if (saved === 'light' || saved === 'dark' || saved === 'night') {
      return saved;
    }
    // Autodetect
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark' | 'night') => {
    setThemeState(newTheme);
  };

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('night');
    } else {
      setTheme('light');
    }
  };

  useEffect(() => {
    // Sync class list with root HTML node
    // In Tailwind, both 'dark' and 'night' can rely on the standard dark: class utilities
    // to provide the baseline dark state, and .night provides the custom color overrides
    document.documentElement.classList.remove('dark', 'night', 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'night') {
      document.documentElement.classList.add('dark', 'night');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Login states
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Poll for state updates every 3 seconds to ensure real-time sync across clients
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      } catch (error) {
        console.error("Failed to sync state", error);
        setIsOffline(true);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentEmployee = state.employees.find(e => e.id === currentUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId.trim() || !password.trim()) {
      setLoginError('Enter both Login ID and Password');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed');
      } else {
        setCurrentUser(data.id); // 'admin' or employee UUID
        setActiveTab('leads');
      }
    } catch (err) {
      setLoginError('Network error');
    }
    setIsLoggingIn(false);
  };

  // View: Login
  if (!currentUser) {
    return (
      <AnimatedCharactersLoginPage
        loginId={loginId}
        setLoginId={setLoginId}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
      />
    );
  }

  const currentName = currentUser === 'admin' 
    ? (state.adminProfile?.name || 'Admin') 
    : (currentEmployee?.name || 'Unknown');

  const currentProfileData = currentUser === 'admin'
    ? {
        name: state.adminProfile?.name || 'Admin',
        loginId: state.adminProfile?.loginId || 'admin',
        password: state.adminProfile?.password || 'admin'
      }
    : {
        name: currentEmployee?.name || '',
        loginId: currentEmployee?.loginId || '',
        password: currentEmployee?.password || ''
      };

  const handleSaveProfile = async (name: string, loginId: string, password?: string) => {
    try {
      const is_admin = currentUser === 'admin';
      const endpoint = is_admin ? '/api/admin/profile' : `/api/employees/${currentUser}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, loginId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to update profile' };
      }
      
      // Sync fresh state across components
      const stateRes = await fetch('/api/state');
      if (stateRes.ok) {
        const freshState = await stateRes.json();
        setState(freshState);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred' };
    }
  };

  const links = currentUser === 'admin' ? [
    {
      label: "Leads Queue",
      href: "#",
      icon: <ClipboardList className="h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('leads')
    },
    {
      label: "Manage Employees",
      href: "#",
      icon: <Users className="h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('employees')
    },
    {
      label: "Activity Sheet",
      href: "#",
      icon: <LayoutList className="h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('sheet')
    },
    {
      label: theme === 'light' ? "Dark Mode" : theme === 'dark' ? "Night Mode" : "Light Mode",
      href: "#",
      icon: theme === 'light' ? (
        <Moon className="h-5 w-5 flex-shrink-0 text-indigo-500" />
      ) : theme === 'dark' ? (
        <Sparkles className="h-5 w-5 flex-shrink-0 text-violet-400" />
      ) : (
        <Sun className="h-5 w-5 flex-shrink-0 text-amber-500" />
      ),
      onClick: cycleTheme
    },
    {
      label: "Sign Out",
      href: "#",
      icon: <LogOut className="h-5 w-5 flex-shrink-0 text-rose-500" />,
      onClick: () => setCurrentUser(null)
    }
  ] : [
    {
      label: "My Leads",
      href: "#",
      icon: <ClipboardList className="h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('leads')
    },
    {
      label: "Activity Sheet",
      href: "#",
      icon: <LayoutList className="h-5 w-5 flex-shrink-0" />,
      onClick: () => setActiveTab('sheet')
    },
    {
      label: theme === 'light' ? "Dark Mode" : theme === 'dark' ? "Night Mode" : "Light Mode",
      href: "#",
      icon: theme === 'light' ? (
        <Moon className="h-5 w-5 flex-shrink-0 text-indigo-500" />
      ) : theme === 'dark' ? (
        <Sparkles className="h-5 w-5 flex-shrink-0 text-violet-400" />
      ) : (
        <Sun className="h-5 w-5 flex-shrink-0 text-amber-500" />
      ),
      onClick: cycleTheme
    },
    {
      label: "Sign Out",
      href: "#",
      icon: <LogOut className="h-5 w-5 flex-shrink-0 text-rose-500" />,
      onClick: () => setCurrentUser(null)
    }
  ];

  // Main Layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors flex flex-col md:flex-row">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {sidebarOpen ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => {
                const isActive = (currentUser === 'admin' && activeTab === (
                  link.label === "Leads Queue" ? "leads" :
                  link.label === "Manage Employees" ? "employees" :
                  link.label === "Activity Sheet" ? "sheet" : ""
                )) || (currentUser !== 'admin' && (
                  (link.label === "My Leads" && activeTab === 'leads') ||
                  (link.label === "Activity Sheet" && activeTab === 'sheet')
                ));
                return (
                  <SidebarLink 
                    key={idx} 
                    link={link} 
                    onClick={link.onClick}
                    className={isActive ? "bg-indigo-50/80 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold border-l-2 border-indigo-500" : ""}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <SidebarLink
              onClick={() => setIsProfileOpen(true)}
              link={{
                label: currentName,
                href: "#",
                icon: (
                  <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <User className="size-4" />
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-col flex-1 min-h-screen overflow-y-auto">
        <NavHeader 
          currentUser={currentUser}
          currentName={currentName}
          onSignOut={() => setCurrentUser(null)}
          onEditProfile={() => setIsProfileOpen(true)}
        />

        {/* Offline Sync State banner */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 dark:bg-red-500/5 text-red-600 dark:text-red-400 font-medium text-xs py-2 px-6 flex items-center justify-center gap-2 border-b border-red-500/10 flex-shrink-0"
            >
              <AlertCircle className="w-3.5 h-3.5 animate-pulse text-red-500" />
              <span>Offline: Attempting to reconnect to Legal Success India portal... (कनेक्शन पुनः जोड़ने का प्रयास किया जा रहा है...)</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blinking Call Alerts Reminder */}
        <AnimatePresence>
          {activeReminders.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs py-3 px-6 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-amber-600/40 shadow-lg flex-shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-slate-950 text-amber-500 animate-pulse">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-slate-950 font-extrabold text-[13px] uppercase tracking-wide">
                    🚨 CALL REMINDER ALERT (कॉल रिमाइंडर सिस्टम)
                  </span>
                  <span className="text-[11px] opacity-90 text-slate-900">
                    You have {activeReminders.length} client follow-up {activeReminders.length === 1 ? 'call' : 'calls'} scheduled for right now. Click on any client below to open details and register notes.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1.5 scrollbar-thin">
                {activeReminders.map(lead => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedLead(lead)}
                    className="px-3.5 py-1.5 bg-slate-950 text-amber-400 hover:text-white hover:bg-slate-900 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md border border-amber-500/20"
                  >
                    <span>👤 {lead.name}</span>
                    <span className="opacity-75 font-mono">({lead.phone})</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          {currentUser === 'admin' ? (
            <AdminDashboard 
              employees={state.employees} 
              leads={state.leads} 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              theme={theme}
              setTheme={setTheme}
              onSelectLead={setSelectedLead}
            />
          ) : currentEmployee ? (
            <EmployeeDashboard 
              employee={currentEmployee} 
              leads={state.leads} 
              employees={state.employees}
              activeTab={activeTab}
              onSelectLead={setSelectedLead}
            />
          ) : (
            <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400">Employee account not found. It may have been removed.</p>
              <button 
                onClick={() => setCurrentUser(null)}
                className="mt-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                Return Home
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Profile Edit Dialog */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        currentProfileData={currentProfileData}
        onSave={handleSaveProfile}
      />

      {/* Lead Edit & History Audit Timeline Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal
            isOpen={!!selectedLead}
            onClose={() => setSelectedLead(null)}
            lead={selectedLead}
            employees={state.employees}
            currentUser={currentUser}
            actorName={currentName}
            onSave={handleSaveLead}
            onDelete={currentUser === 'admin' ? handleDeleteLead : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
