import React from 'react';
import { 
  Clock, 
  Package, 
  Wrench, 
  FileDown, 
  FileText, 
  CheckCircle2,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  DailyShift, 
  ProductionOrder, 
  Repair, 
  Employee, 
  Client, 
  Product, 
  Transaction 
} from '../../types';
import { formatDate } from '../../lib/utils';

interface ReportsViewProps {
  reportType: 'hours' | 'production' | 'repairs';
  setReportType: (val: 'hours' | 'production' | 'repairs') => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  reportStatusFilter: string;
  setReportStatusFilter: (val: string) => void;
  shifts: (DailyShift & { employeeName?: string })[];
  employees: Employee[];
  productionOrders: ProductionOrder[];
  repairs: Repair[];
  clients: Client[];
  products: Product[];
  transactions: Transaction[];
  exportReportToPDF: (data: any[]) => void;
  exportAllDetailedReportToPDF: (data: any[]) => void;
  exportProductionOrderReportPDF: (orders: ProductionOrder[], type: 'grouped' | 'detailed') => void;
  exportBulkIndividualProductionOrderPDF: (orders: ProductionOrder[]) => void;
  exportRepairReportPDF: (repairs: Repair[]) => void;
  setSelectedShifts: (val: number[]) => void;
  setIsGroupedFinanceModalOpen: (val: boolean) => void;
  exportEmployeeGroupedPDF: (name: string, shifts: DailyShift[]) => void;
  toggleProductionStatus: (order: ProductionOrder) => void;
}

export const ReportsView = ({
  reportType,
  setReportType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  reportStatusFilter,
  setReportStatusFilter,
  shifts,
  employees,
  productionOrders,
  repairs,
  clients,
  products,
  transactions,
  exportReportToPDF,
  exportAllDetailedReportToPDF,
  exportProductionOrderReportPDF,
  exportBulkIndividualProductionOrderPDF,
  exportRepairReportPDF,
  setSelectedShifts,
  setIsGroupedFinanceModalOpen,
  exportEmployeeGroupedPDF,
  toggleProductionStatus
}: ReportsViewProps) => {

  const getReportData = () => {
    const filteredShifts = shifts.filter(s => {
      const isWithinDateRange = (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
      const isStatusMatch = reportStatusFilter === 'all' || s.status === reportStatusFilter;
      return isWithinDateRange && isStatusMatch;
    });

    const reportData: { [key: number]: { name: string, totalShifts: number, totalHours: number, totalAmount: number, shifts: DailyShift[] } } = {};

    filteredShifts.forEach(shift => {
      if (!reportData[shift.employeeId]) {
        const emp = employees.find(e => e.id === shift.employeeId);
        if (emp) {
          reportData[shift.employeeId] = { name: emp.name, totalShifts: 0, totalHours: 0, totalAmount: 0, shifts: [] };
        }
      }
      if (reportData[shift.employeeId]) {
        reportData[shift.employeeId].totalShifts += 1;
        reportData[shift.employeeId].totalHours += (shift.hoursWorked || 0);
        reportData[shift.employeeId].totalAmount += shift.amount;
        reportData[shift.employeeId].shifts.push(shift);
      }
    });

    return Object.values(reportData).sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <motion.div 
      key="reports"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <button 
          onClick={() => setReportType('hours')}
          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border ${
            reportType === 'hours' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border-indigo-600' 
              : 'bg-indigo-50/50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50'
          }`}
        >
          <Clock size={20} />
          Horas e Diárias
        </button>
        <button 
          onClick={() => setReportType('production')}
          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border ${
            reportType === 'production' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 border-emerald-600' 
              : 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50'
          }`}
        >
          <Package size={20} />
          Ordens de Produção
        </button>
        <button 
          onClick={() => setReportType('repairs')}
          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border ${
            reportType === 'repairs' 
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-100 border-amber-600' 
              : 'bg-amber-50/50 text-amber-700 border-amber-100 hover:bg-amber-100/50'
          }`}
        >
          <Wrench size={20} />
          Concertos
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
            <input 
              type="date" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
            <input 
              type="date" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {reportType === 'hours' && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Status das Diárias</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="pending">Apenas Pendentes</option>
                <option value="paid">Apenas Pagas</option>
              </select>
            </div>
          )}
          {reportType === 'production' && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Status da Produção</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="pending">Pendentes (Em andamento)</option>
                <option value="completed">Finalizadas</option>
              </select>
            </div>
          )}
          {reportType === 'repairs' && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Concerto</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="entry">Entradas (Para Concerto)</option>
                <option value="exit">Saídas (Consertados)</option>
              </select>
            </div>
          )}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {reportType === 'hours' && (
              <>
                <button 
                  onClick={() => exportReportToPDF(getReportData())}
                  className="w-full py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  title="Exportar Resumo Consolidado"
                >
                  <FileDown size={18} /> RESUMO
                </button>
                <button 
                  onClick={() => exportAllDetailedReportToPDF(getReportData())}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  title="Exportar Detalhado de Todos"
                >
                  <FileDown size={18} /> DETALHADO
                </button>
              </>
            )}
            {reportType === 'production' && (
              <>
                <button 
                  onClick={() => {
                    let filtered = productionOrders;
                    if (startDate) {
                      filtered = filtered.filter(o => o.startDate >= startDate);
                    }
                    if (endDate) {
                      filtered = filtered.filter(o => o.startDate <= endDate);
                    }
                    
                    if (reportStatusFilter === 'pending') {
                      filtered = filtered.filter(o => o.status !== 'completed');
                    } else if (reportStatusFilter === 'completed') {
                      filtered = filtered.filter(o => o.status === 'completed');
                    }

                    if (filtered.length === 0) {
                      alert('Nenhuma ordem de produção encontrada para os filtros selecionados.');
                      return;
                    }
                    exportProductionOrderReportPDF(filtered, 'grouped');
                  }}
                  className="w-full py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  title="Exportar Agrupado por Status"
                >
                  <FileDown size={18} /> AGRUPADO
                </button>
                <button 
                  onClick={() => {
                    let filtered = productionOrders;
                    if (startDate) {
                      filtered = filtered.filter(o => o.startDate >= startDate);
                    }
                    if (endDate) {
                      filtered = filtered.filter(o => o.startDate <= endDate);
                    }
                    
                    if (reportStatusFilter === 'pending') {
                      filtered = filtered.filter(o => o.status !== 'completed');
                    } else if (reportStatusFilter === 'completed') {
                      filtered = filtered.filter(o => o.status === 'completed');
                    }
                    
                    if (filtered.length === 0) {
                      alert('Nenhuma ordem de produção encontrada para os filtros selecionados.');
                      return;
                    }
                    exportBulkIndividualProductionOrderPDF(filtered);
                  }}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  title="Exportar Fichas Individuais Detalhadas"
                >
                  <FileText size={18} /> FICHAS INDIVIDUAIS
                </button>
                <button 
                  onClick={() => {
                    let filtered = productionOrders;
                    if (startDate) {
                      filtered = filtered.filter(o => o.startDate >= startDate);
                    }
                    if (endDate) {
                      filtered = filtered.filter(o => o.startDate <= endDate);
                    }
                    
                    if (reportStatusFilter === 'pending') {
                      filtered = filtered.filter(o => o.status !== 'completed');
                    } else if (reportStatusFilter === 'completed') {
                      filtered = filtered.filter(o => o.status === 'completed');
                    }

                    if (filtered.length === 0) {
                      alert('Nenhuma ordem de produção encontrada para os filtros selecionados.');
                      return;
                    }
                    exportProductionOrderReportPDF(filtered, 'detailed');
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  title="Exportar Tabela Detalhada de Ordens"
                >
                  <FileDown size={18} /> DETALHADO
                </button>
              </>
            )}
            {reportType === 'repairs' && (
              <button 
                onClick={() => {
                  let filtered = repairs.filter(r => (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate));
                  if (reportStatusFilter !== 'all') {
                    filtered = filtered.filter(r => r.type === reportStatusFilter);
                  }
                  exportRepairReportPDF(filtered);
                }}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <FileDown size={18} /> GERAR RELATÓRIO
              </button>
            )}
          </div>
        </div>

        {reportType === 'hours' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Total de Diárias</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {getReportData().reduce((acc, curr) => acc + curr.totalShifts, 0)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Total de Horas</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {getReportData().reduce((acc, curr) => acc + curr.totalHours, 0).toFixed(1)}h
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Valor Total</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      R$ {getReportData().reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-wider">Média Horas/D</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {(getReportData().reduce((acc, curr) => acc + curr.totalHours, 0) / (getReportData().reduce((acc, curr) => acc + curr.totalShifts, 0) || 1)).toFixed(1)}h
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Funcionário</th>
                    <th className="px-6 py-4 font-semibold">Total Diárias</th>
                    <th className="px-6 py-4 font-semibold">Total Horas</th>
                    <th className="px-6 py-4 font-semibold">Valor Total</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getReportData().map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{item.name}</td>
                      <td className="px-6 py-4 text-slate-600">{item.totalShifts}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{item.totalHours}h</td>
                      <td className="px-6 py-4 font-bold text-indigo-600">R$ {item.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.shifts.some(s => s.status === 'pending') && (
                            <button 
                              onClick={async () => {
                                const pendingIds = item.shifts.filter(s => s.status === 'pending').map(s => s.id);
                                if (pendingIds.length > 0) {
                                  setSelectedShifts(pendingIds);
                                  setIsGroupedFinanceModalOpen(true);
                                }
                              }}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-2 text-xs font-bold"
                              title="Baixar Diárias Pendentes"
                            >
                              <CheckCircle2 size={16} /> Baixar
                            </button>
                          )}
                          <button 
                            onClick={() => exportEmployeeGroupedPDF(item.name, item.shifts)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-2 text-xs font-bold"
                            title="Exportar Detalhado"
                          >
                            <FileDown size={16} /> Detalhado
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getReportData().length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Nenhum dado encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {reportType === 'production' && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Total de Ordens</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).length}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Total de Peças</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).reduce((acc, curr) => acc + curr.totalPieces, 0)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Valor Total</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      R$ {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).reduce((acc, curr) => acc + (curr.totalValue || 0), 0).toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Visualização de Ordens de Produção</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Finalizado
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" /> Pendente
                </span>
              </div>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ordem</th>
                    <th className="px-4 py-3 font-semibold">Cliente/Produto</th>
                    <th className="px-4 py-3 font-semibold">Grade (Breakdown)</th>
                    <th className="px-4 py-3 font-semibold text-center">Peças</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productionOrders
                    .filter(o => {
                      if (!startDate || !endDate) return true;
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const orderDate = new Date(o.startDate);
                      return orderDate >= start && orderDate <= end;
                    })
                    .filter(o => {
                      if (reportStatusFilter === 'pending') return o.status !== 'completed';
                      if (reportStatusFilter === 'completed') return o.status === 'completed';
                      return true;
                    })
                    .map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {order.orderNumber && (
                              <span className="px-1 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-mono font-bold">
                                #{order.orderNumber}
                              </span>
                            )}
                            <p className="font-medium text-slate-700 text-sm">{order.description}</p>
                          </div>
                          <p className="text-[10px] text-slate-400">{formatDate(order.startDate)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-600">{clients.find(c => c.id === order.clientId)?.name || '-'}</p>
                          <p className="text-[10px] text-slate-400">{order.items?.map(i => i.productName).join(', ') || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(order.items || []).flatMap(item => item.itemsBreakdown).map((b, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">
                                {b.color}/{b.size}: <strong>{b.quantity}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700 text-sm">
                          {order.totalPieces}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {order.status === 'completed' ? 'Finalizado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => toggleProductionStatus(order)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              order.status === 'completed' 
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            }`}
                          >
                            {order.status === 'completed' ? 'Reabrir' : 'Finalizar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        Nenhuma ordem encontrada para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'repairs' && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Wrench size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 font-bold uppercase tracking-wider">Total Entradas</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {repairs.filter(r => r.type === 'entry' && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate)).reduce((acc, curr) => acc + curr.quantity, 0)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Total Saídas</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {repairs.filter(r => r.type === 'exit' && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate)).reduce((acc, curr) => acc + curr.quantity, 0)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Saldo Pendente</p>
                    <h3 className="text-2xl font-black text-slate-800">
                      {repairs.filter(r => (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate)).reduce((acc, curr) => acc + (curr.type === 'entry' ? curr.quantity : -curr.quantity), 0)}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Visualização de Concertos</h3>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold">Cor/Tam</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold text-center">Qtd</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repairs
                    .filter(r => {
                      if (!startDate || !endDate) return true;
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const repairDate = new Date(r.date);
                      return repairDate >= start && repairDate <= end;
                    })
                    .filter(r => {
                      if (reportStatusFilter === 'all') return true;
                      return r.type === reportStatusFilter;
                    })
                    .map(repair => (
                      <tr key={repair.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700 text-sm">
                          {products.find(p => p.id === repair.productId)?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {repair.color} / {repair.size}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            repair.type === 'entry' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {repair.type === 'entry' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700 text-sm">
                          {repair.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(repair.date)}
                        </td>
                      </tr>
                    ))}
                  {repairs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        Nenhum concerto encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
