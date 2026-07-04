"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface MenuContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuContainer({ 
  children, 
  className,
  radius = 84, // slightly larger for breathable spacing
  startAngle = -180, // perfect for bottom-right: fans straight-left to straight-up
  endAngle = -90
}: { 
  children: React.ReactNode; 
  className?: string; 
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray[0];
  const items = childrenArray.slice(1);
  const N = items.length;

  // Layout math for arc fanning
  const angleRange = endAngle - startAngle;
  const angleStep = N > 1 ? angleRange / (N - 1) : 0;

  return (
    <MenuContext.Provider value={{ isExpanded, setIsExpanded }}>
      <div 
        data-expanded={isExpanded} 
        className={cn("relative flex items-center justify-center w-16 h-16", className)}
      >
        {/* Expanded background overlay/glow */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.25, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-xl pointer-events-none"
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            />
          )}
        </AnimatePresence>

        {/* Floating Menu Items (perfectly centered absolute wrapper) */}
        {items.map((item, idx) => {
          const angleInRad = ((startAngle + idx * angleStep) * Math.PI) / 180;
          const x = Math.cos(angleInRad) * radius;
          const y = Math.sin(angleInRad) * radius;

          return (
            <div
              key={idx}
              className="absolute top-2.5 left-2.5 w-11 h-11 pointer-events-none flex items-center justify-center"
              style={{ zIndex: 10 + idx }}
            >
              <motion.div
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: isExpanded ? x : 0,
                  y: isExpanded ? y : 0,
                  scale: isExpanded ? 1 : 0,
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 18,
                  delay: isExpanded ? idx * 0.04 : (N - 1 - idx) * 0.02,
                }}
                className="pointer-events-auto"
              >
                {item}
              </motion.div>
            </div>
          );
        })}

        {/* Center Trigger Button */}
        <div className="relative z-50 flex items-center justify-center">
          {trigger}
        </div>
      </div>
    </MenuContext.Provider>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
}

export function MenuItem({ 
  icon, 
  onClick, 
  className,
  title 
}: MenuItemProps) {
  const context = useContext(MenuContext);
  const isExpanded = context?.isExpanded ?? false;
  const setIsExpanded = context?.setIsExpanded;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else if (setIsExpanded) {
      // If no custom onClick, it's the toggle trigger
      setIsExpanded(!isExpanded);
    }
  };

  const isTrigger = !onClick;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      title={title}
      className={cn(
        "flex items-center justify-center rounded-full shadow-lg border transition-colors cursor-pointer",
        isTrigger 
          ? "w-14 h-14 bg-indigo-600 dark:bg-indigo-700 text-white border-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600" 
          : "w-11 h-11 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
        className
      )}
    >
      {icon}
    </motion.button>
  );
}
