import React from 'react';
import { 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  RotateCcw,
  X,
  Menu,
  Settings,
  AlertTriangle,
  RefreshCcw,
  FileDown,
  Filter,
  BarChart3,
  ShoppingCart,
  Truck,
  Scissors,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  UserPlus,
  UserCheck,
  Eye,
  EyeOff,
  Image,
  FileText,
  Database,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Common';
import { Button } from './Button';
import { cn } from '../lib/utils';

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setPartnerTab: (tab: any) => void;
  handleLogout: () => void;
}

export const Sidebar = ({ 
  view, 
  setView, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  setPartnerTab, 
  handleLogout 
}: SidebarProps) => {
  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-bold">
            <span className="text-[#2d3436]">Confecção</span>
            <span className="text-[#7b2cbf] ml-0.5">Pro</span>
          </span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors"
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <span className="font-bold">
              <span className="text-[#2d3436]">Confecção</span>
              <span className="text-[#7b2cbf] ml-0.5">Pro</span>
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <Button 
            variant="ghost"
            onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm border border-emerald-100' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<Calendar size={20} className={view === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'} />}
          >
            Painel Geral
          </Button>
          <Button 
            variant="ghost"
            onClick={() => { setView('partners'); setPartnerTab('clients'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'partners' ? 'bg-cyan-50 text-cyan-700 font-bold shadow-sm border border-cyan-100' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<UserCheck size={20} className={view === 'partners' ? 'text-cyan-600' : 'text-slate-400'} />}
          >
            Parceiros
          </Button>
          <Button 
            variant="ghost"
            onClick={() => { setView('production'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'production' ? 'bg-rose-50 text-rose-700 font-bold shadow-sm border border-rose-100' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<Scissors size={20} className={view === 'production' ? 'text-rose-600' : 'text-slate-400'} />}
          >
            Produção
          </Button>
          <Button 
            variant="ghost"
            onClick={() => { setView('shifts'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'shifts' ? 'bg-sky-50 text-sky-700 font-bold shadow-sm border border-sky-100' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<Clock size={20} className={view === 'shifts' ? 'text-sky-600' : 'text-slate-400'} />}
          >
            Diária
          </Button>
          <Button 
            variant="ghost"
            onClick={() => { setView('finance'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'finance' ? 'bg-amber-50 text-amber-700 font-bold shadow-sm border border-amber-100' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<TrendingUp size={20} className={view === 'finance' ? 'text-amber-600' : 'text-slate-400'} />}
          >
            Financeiro
          </Button>
          <Button 
            variant="ghost"
            onClick={() => { setView('reports'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'reports' ? 'bg-violet-50 text-violet-700 font-bold shadow-sm border border-violet-100' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<FileDown size={20} className={view === 'reports' ? 'text-violet-600' : 'text-slate-400'} />}
          >
            Relatórios
          </Button>
          <Button 
            variant="ghost"
            onClick={() => { setView('settings'); setIsSidebarOpen(false); }}
            className={cn(
              "w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all",
              view === 'settings' ? 'bg-slate-100 text-slate-700 font-bold shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-50'
            )}
            leftIcon={<Settings size={20} className={view === 'settings' ? 'text-slate-600' : 'text-slate-400'} />}
          >
            Configurações
          </Button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
            leftIcon={<LogOut size={20} />}
          >
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
};
