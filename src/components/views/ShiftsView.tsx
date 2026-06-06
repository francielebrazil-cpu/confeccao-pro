import React from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  LayoutGrid, 
  List, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Edit2, 
  Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyShift, Employee } from '../../types';
import { formatDate } from '../../lib/utils';

interface ShiftsViewProps {
  shifts: (DailyShift & { employeeName?: string })[];
  employees: Employee[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  isGroupedView: boolean;
  setIsGroupedView: (val: boolean) => void;
  selectedShifts: number[];
  setSelectedShifts: (val: number[] | ((prev: number[]) => number[])) => void;
  expandedEmployees: number[];
  setExpandedEmployees: (val: number[] | ((prev: number[]) => number[])) => void;
  generateBatchPaymentReceiptPDF: () => void;
  bulkDeleteShifts: () => void;
  bulkPayShifts: () => void;
  triggerConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmColor?: string) => void;
  toggleShiftSelection: (id: number) => void;
  setEditingShift: (val: any) => void;
  setIsShiftModalOpen: (val: boolean) => void;
  generatePaymentReceiptPDF: (shift: DailyShift) => void;
  deleteShift: (id: number) => void;
  toggleShiftStatus: (shift: DailyShift) => void;
}

export const ShiftsView = ({
  shifts,
  employees,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isGroupedView,
  setIsGroupedView,
  selectedShifts,
  setSelectedShifts,
  expandedEmployees,
  setExpandedEmployees,
  generateBatchPaymentReceiptPDF,
  bulkDeleteShifts,
  bulkPayShifts,
  triggerConfirm,
  toggleShiftSelection,
  setEditingShift,
  setIsShiftModalOpen,
  generatePaymentReceiptPDF,
  deleteShift,
  toggleShiftStatus
}: ShiftsViewProps) => {

  const getGroupedShifts = () => {
    const filtered = shifts.filter(s => (
      s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    ) && (
      statusFilter === 'all' || s.status === statusFilter
    ) && (
      (startDate ? s.date >= startDate : true) && 
      (endDate ? s.date <= endDate : true)
    ));

    const groups: { [key: number]: { employee: Employee, shifts: DailyShift[], totalAmount: number, pendingAmount: number } } = {};
    
    filtered.forEach(shift => {
      if (!groups[shift.employeeId]) {
        const emp = employees.find(e => e.id === shift.employeeId);
        if (emp) {
          groups[shift.employeeId] = { employee: emp, shifts: [], totalAmount: 0, pendingAmount: 0 };
        }
      }
      if (groups[shift.employeeId]) {
        groups[shift.employeeId].shifts.push(shift);
        groups[shift.employeeId].totalAmount += shift.amount;
        if (shift.status === 'pending') {
          groups[shift.employeeId].pendingAmount += shift.amount;
        }
      }
    });

    return Object.values(groups).sort((a, b) => b.pendingAmount - a.pendingAmount);
  };

  const toggleEmployeeExpansion = (id: number) => {
    setExpandedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      key="shifts"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por funcionário ou observação..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Filter size={18} className="text-slate-400" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos Status</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Calendar size={18} className="text-slate-400" />
              <input 
                type="date" 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 cursor-pointer"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-slate-300">até</span>
              <input 
                type="date" 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 cursor-pointer"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setIsGroupedView(true)}
                className={`p-2 rounded-xl transition-all ${isGroupedView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Agrupar por Funcionário"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setIsGroupedView(false)}
                className={`p-2 rounded-xl transition-all ${!isGroupedView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Visualização em Lista"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedShifts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  {selectedShifts.length}
                </div>
                <span className="text-indigo-900 font-medium">Registros selecionados</span>
              </div>
              <button 
                onClick={() => setSelectedShifts([])}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={generateBatchPaymentReceiptPDF}
                className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                title="Gerar recibos para os itens selecionados"
              >
                <FileText size={16} />
                Recibo em Lote
              </button>
              <button 
                onClick={() => {
                  triggerConfirm(
                    'Excluir Selecionados',
                    `Deseja realmente excluir os ${selectedShifts.length} registros selecionados?`,
                    bulkDeleteShifts
                  );
                }}
                className="w-full py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Excluir
              </button>
              <button 
                onClick={() => {
                  triggerConfirm(
                    'Pagar Selecionados',
                    `Deseja marcar os ${selectedShifts.length} registros como pagos e integrar ao financeiro?`,
                    bulkPayShifts,
                    'Pagar',
                    'bg-emerald-600'
                  );
                }}
                className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 size={16} />
                Pagar Selecionados
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isGroupedView ? (
          getGroupedShifts().map(group => (
            <div key={group.employee.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div 
                className="p-4 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleEmployeeExpansion(group.employee.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    {group.employee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{group.employee.name}</h3>
                    <p className="text-xs text-slate-500">{group.shifts.length} lançamentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                    <p className="font-bold text-slate-700">R$ {group.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-amber-500 uppercase font-bold">Pendente</p>
                    <p className="font-bold text-amber-600">R$ {group.pendingAmount.toFixed(2)}</p>
                  </div>
                  <div className={`transition-transform ${expandedEmployees.includes(group.employee.id) ? 'rotate-180' : ''}`}>
                    <ChevronRight size={20} className="text-slate-400" />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedEmployees.includes(group.employee.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3 w-10">
                              <input 
                                type="checkbox" 
                                className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                checked={group.shifts.every(s => selectedShifts.includes(s.id))}
                                onChange={() => {
                                  const groupIds = group.shifts.map(s => s.id);
                                  const allSelected = groupIds.every(id => selectedShifts.includes(id));
                                  if (allSelected) {
                                    setSelectedShifts(prev => prev.filter(id => !groupIds.includes(id)));
                                  } else {
                                    setSelectedShifts(prev => [...new Set([...prev, ...groupIds])]);
                                  }
                                }}
                              />
                            </th>
                            <th className="px-6 py-3 font-semibold">Data</th>
                            <th className="px-6 py-3 font-semibold">Horas</th>
                            <th className="px-6 py-3 font-semibold">Valor</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                            <th className="px-6 py-3 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.shifts.map(shift => (
                            <tr key={shift.id} className={`hover:bg-slate-50/50 transition-colors ${selectedShifts.includes(shift.id) ? 'bg-indigo-50/30' : ''}`}>
                              <td className="px-6 py-3">
                                <input 
                                  type="checkbox" 
                                  className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                  checked={selectedShifts.includes(shift.id)}
                                  onChange={() => toggleShiftSelection(shift.id)}
                                />
                              </td>
                              <td className="px-6 py-3 text-slate-500">{formatDate(shift.date)}</td>
                              <td className="px-6 py-3 text-slate-500">{shift.hoursWorked ? `${shift.hoursWorked}h` : '-'}</td>
                              <td className="px-6 py-3 font-semibold text-slate-700">
                                R$ {shift.amount.toFixed(2)}
                                {shift.isHalfDay && <span className="ml-2 text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100 uppercase">Meia</span>}
                              </td>
                              <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${shift.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {shift.status === 'paid' ? 'Pago' : 'Pendente'}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button 
                                    onClick={() => { setEditingShift(shift); setIsShiftModalOpen(true); }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                                    title="Editar"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  {shift.status === 'paid' && (
                                    <button 
                                      onClick={() => generatePaymentReceiptPDF(shift)}
                                      className="p-1.5 text-emerald-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50"
                                      title="Gerar Recibo"
                                    >
                                      <FileText size={14} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => deleteShift(shift.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                    title="Excluir"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        checked={shifts.length > 0 && shifts.filter(s => (
                          s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.notes?.toLowerCase().includes(searchTerm.toLowerCase())
                        ) && (
                          statusFilter === 'all' || s.status === statusFilter
                        ) && (
                          (startDate ? s.date >= startDate : true) && 
                          (endDate ? s.date <= endDate : true)
                        )).every(s => selectedShifts.includes(s.id))}
                        onChange={() => {
                          const filteredIds = shifts.filter(s => (
                            s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.notes?.toLowerCase().includes(searchTerm.toLowerCase())
                          ) && (
                            statusFilter === 'all' || s.status === statusFilter
                          ) && (
                            (startDate ? s.date >= startDate : true) && 
                            (endDate ? s.date <= endDate : true)
                          )).map(s => s.id);
                          const allSelected = filteredIds.every(id => selectedShifts.includes(id));
                          if (allSelected) {
                            setSelectedShifts(prev => prev.filter(id => !filteredIds.includes(id)));
                          } else {
                            setSelectedShifts(prev => [...new Set([...prev, ...filteredIds])]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-4 font-semibold">Funcionário</th>
                    <th className="px-6 py-4 font-semibold">Data</th>
                    <th className="px-6 py-4 font-semibold">Valor</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.filter(s => (
                    s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.notes?.toLowerCase().includes(searchTerm.toLowerCase())
                  ) && (
                    statusFilter === 'all' || s.status === statusFilter
                  ) && (
                    (startDate ? s.date >= startDate : true) && 
                    (endDate ? s.date <= endDate : true)
                  )).map(shift => (
                    <tr key={shift.id} className={`hover:bg-slate-50 transition-colors ${selectedShifts.includes(shift.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          checked={selectedShifts.includes(shift.id)}
                          onChange={() => toggleShiftSelection(shift.id)}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{shift.employeeName}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(shift.date)}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        R$ {shift.amount.toFixed(2)}
                        {shift.isHalfDay && <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase font-normal">Meia</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${shift.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {shift.status === 'paid' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {shift.status === 'paid' && (
                            <button 
                              onClick={() => generatePaymentReceiptPDF(shift)}
                              className="p-2 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                              title="Gerar Recibo"
                            >
                              <FileText size={16} />
                            </button>
                          )}
                          {shift.status === 'pending' ? (
                            <button 
                              onClick={() => toggleShiftStatus(shift)}
                              className="p-2 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50"
                              title="Confirmar Pagamento"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => toggleShiftStatus(shift)}
                              className="p-2 text-amber-500 hover:text-amber-700 rounded-lg hover:bg-amber-50"
                              title="Estornar Pagamento"
                            >
                              <Clock size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => { setEditingShift(shift); setIsShiftModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteShift(shift.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
