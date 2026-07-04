import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Menu, X } from "lucide-react";

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 w-[280px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "78px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <div
      className={cn(
        "h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 w-full border-b border-slate-200 dark:border-slate-800"
      )}
      {...props}
    >
      <div className="flex justify-between items-center w-full z-20">
        <div className="flex items-center">
          {/* Logo or Brand placeholder shown on mobile header */}
          <div className="h-5 w-6 bg-indigo-600 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
          <span className="font-extrabold text-xs ml-2 tracking-wider text-slate-900 dark:text-white uppercase">
            LEGAL SUCCESS
          </span>
        </div>
        <button
          className="text-slate-800 dark:text-slate-200 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-white dark:bg-slate-950 p-6 z-[100] flex flex-col justify-between",
              className
            )}
          >
            <div
              className="absolute right-6 top-5 z-50 text-slate-800 dark:text-slate-200 cursor-pointer p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setOpen(!open)}
            >
              <X className="w-6 h-6" />
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto mt-8">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface LinkProps {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: LinkProps;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
} & Omit<React.ComponentProps<"a">, "onClick">) => {
  const { open, animate } = useSidebar();
  return (
    <a
      href={link.href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className={cn(
        "flex items-center gap-3.5 group/sidebar py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-200 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium text-sm cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 text-slate-500 group-hover/sidebar:text-indigo-600 dark:text-slate-400 dark:group-hover/sidebar:text-indigo-400 transition-colors">
        {link.icon}
      </div>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-slate-700 dark:text-slate-200 group-hover/sidebar:translate-x-1 transition-transform duration-200 whitespace-nowrap"
      >
        {link.label}
      </motion.span>
    </a>
  );
};
