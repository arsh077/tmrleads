import React from 'react';
import { Scale, LogOut, Shield, User, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface NavHeaderProps {
  currentUser: 'admin' | string | null;
  currentName: string;
  onSignOut: () => void;
  onEditProfile?: () => void;
}

export default function NavHeader({ currentUser, currentName, onSignOut, onEditProfile }: NavHeaderProps) {
  const isAdmin = currentUser === 'admin';

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Brand Segment */}
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.05 }}
              className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-600 dark:to-violet-700 text-white shadow-md shadow-indigo-500/10"
            >
              <Scale className="size-5" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                LEGAL SUCCESS INDIA
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                Trademark Lead Portal
              </span>
            </div>
          </div>

          {/* Right Controls & Profile */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Real-time sync status pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Live Sync Active
              </span>
            </div>

            {/* Profile Pill */}
            <div 
              onClick={onEditProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/60 shadow-sm cursor-pointer transition-colors"
              title="Edit your Profile"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                {isAdmin ? <Shield className="size-4" /> : <User className="size-4" />}
              </div>
              <div className="flex flex-col pr-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                  Logged in as
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {currentName}
                </span>
              </div>
            </div>

            {/* Logout Trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignOut}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200/40 hover:border-rose-200 dark:border-slate-700/40 dark:hover:border-rose-900/30 transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </motion.button>

          </div>

        </div>
      </div>
    </motion.div>
  );
}
