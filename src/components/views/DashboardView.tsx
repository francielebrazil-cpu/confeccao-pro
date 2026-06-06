import React from 'react';
import { 
  Plus, 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Scissors, 
  Wrench, 
  Package, 
  BarChart3 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import { Employee, DailyShift, ProductionOrder, Product, Transaction } from '../../types';
import { formatDate } from '../../lib/utils';

interface DashboardViewProps {
  employees: Employee[];
  shifts: (DailyShift & { employeeName?: string })[];
  productionOrders: ProductionOrder[];
  transactions: Transaction[];
  setEditingShift: (val: any) => void;
  setIsShiftModalOpen: (val: boolean) => void;
  setIsProductionStepModalOpen: (val: boolean) => void;
  setRepairItemsBreakdown: (val: any) => void;
  setIsRepairModalOpen: (val: boolean) => void;
  setEditingProductionOrder: (val: any) => void;
  setItemsBreakdown: (val: any) => void;
  setSelectedProductIdForOrder: (val: any) => void;
  setIsProductionOrderModalOpen: (val: boolean) => void;
  setIsFinanceModalOpen: (val: boolean) => void;
  setEditingClient: (val: any) => void;
  setIsClientModalOpen: (val: boolean) => void;
  setEditingEmployee: (val: any) => void;
  setIsEmployeeModalOpen: (val: boolean) => void;
}

export const DashboardView = ({
  employees,
  shifts,
  productionOrders,
  transactions,
  setEditingShift,
  setIsShiftModalOpen,
  setIsProductionStepModalOpen,
  setRepairItemsBreakdown,
  setIsRepairModalOpen,
  setEditingProductionOrder,
  setItemsBreakdown,
  setSelectedProductIdForOrder,
  setIsProductionOrderModalOpen,
  setIsFinanceModalOpen,
  setEditingClient,
  setIsClientModalOpen,
  setEditingEmployee,
  setIsEmployeeModalOpen
}: DashboardViewProps) => {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-600" />
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <button 
            onClick={() => { setEditingShift(null); setIsShiftModalOpen(true); }}
            className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <Plus size={24} />
            <span className="text-[10px] font-bold uppercase">Lançar Diária</span>
          </button>
          <button 
            onClick={() => setIsProductionStepModalOpen(true)}
            className="p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <Scissors size={24} />
            <span className="text-[10px] font-bold uppercase">Lançar Produção</span>
          </button>
          <button 
            onClick={() => { setRepairItemsBreakdown([]); setIsRepairModalOpen(true); }}
            className="p-4 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <Wrench size={24} />
            <span className="text-[10px] font-bold uppercase">Lançar Concerto</span>
          </button>
          <button 
            onClick={() => { 
              setEditingProductionOrder(null); 
              setItemsBreakdown([]);
              setSelectedProductIdForOrder(null);
              setIsProductionOrderModalOpen(true); 
            }}
            className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <Package size={24} />
            <span className="text-[10px] font-bold uppercase">Nova Ordem</span>
          </button>
          <button 
            onClick={() => setIsFinanceModalOpen(true)}
            className="p-4 bg-slate-50 text-slate-700 rounded-2xl hover:bg-slate-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <DollarSign size={24} />
            <span className="text-[10px] font-bold uppercase">Nova Transação</span>
          </button>
          <button 
            onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }}
            className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <Plus size={24} />
            <span className="text-[10px] font-bold uppercase">Novo Cliente</span>
          </button>
          <button 
            onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
            className="p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all flex flex-col items-center gap-2 text-center"
          >
            <Plus size={24} />
            <span className="text-[10px] font-bold uppercase">Novo Funcionário</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Funcionários</p>
              <h3 className="text-3xl font-black text-slate-800">{employees.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-bold uppercase tracking-wider">Diárias Pendentes</p>
              <h3 className="text-3xl font-black text-slate-800">
                {shifts.filter(s => s.status === 'pending').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Total a Pagar</p>
              <h3 className="text-3xl font-black text-slate-800">
                R$ {shifts.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <h3 className="font-bold text-slate-800">Fluxo de Diárias (Últimos 7 dias)</h3>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(() => {
                  const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d.toISOString().split('T')[0];
                  });
                  
                  return last7Days.map(date => {
                    const dayShifts = shifts.filter(s => s.date === date);
                    return {
                      date: formatDate(date),
                      total: dayShifts.reduce((acc, s) => acc + s.amount, 0),
                      count: dayShifts.length
                    };
                  });
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {(() => {
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return d.toISOString().split('T')[0];
                    });
                    return last7Days.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 6 ? '#4f46e5' : '#818cf8'} />
                    ));
                  })()}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Scissors size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Status da Produção (Peças)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Planejamento', value: productionOrders.filter(o => o.status === 'planning').reduce((acc, o) => acc + (Number(o.totalPieces) || 0), 0) },
                    { name: 'Corte', value: productionOrders.filter(o => o.status === 'cutting').reduce((acc, o) => acc + (Number(o.totalPieces) || 0), 0) },
                    { name: 'Costura', value: productionOrders.filter(o => o.status === 'sewing').reduce((acc, o) => acc + (Number(o.totalPieces) || 0), 0) },
                    { name: 'Acabamento', value: productionOrders.filter(o => o.status === 'finishing').reduce((acc, o) => acc + (Number(o.totalPieces) || 0), 0) },
                    { name: 'Finalizado', value: productionOrders.filter(o => o.status === 'completed').reduce((acc, o) => acc + (Number(o.totalPieces) || 0), 0) },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#94a3b8" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#6366f1" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} peças`, 'Quantidade']} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <h3 className="font-bold text-slate-800">Financeiro (Últimos 30 dias)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(() => {
                  const income = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
                  const expense = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
                  const payroll = shifts.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.amount, 0);
                  return [
                    { name: 'Entradas', value: income, fill: '#10b981' },
                    { name: 'Saídas', value: expense + payroll, fill: '#ef4444' }
                  ];
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {[{ name: 'Entradas', fill: '#10b981' }, { name: 'Saídas', fill: '#ef4444' }].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
