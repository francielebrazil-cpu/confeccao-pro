import React from 'react';
import { 
  Plus, 
  FileText, 
  RotateCcw, 
  DollarSign, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Transaction, 
  ProductionOrder, 
  DailyShift 
} from '../../types';

interface FinanceViewProps {
  financeTab: 'history' | 'payable' | 'receivable' | 'reconciliation' | 'dre' | 'balance';
  setFinanceTab: (val: 'history' | 'payable' | 'receivable' | 'reconciliation' | 'dre' | 'balance') => void;
  setIsFinanceModalOpen: (val: boolean) => void;
  transactions: Transaction[];
  productionOrders: ProductionOrder[];
  shifts: DailyShift[];
  selectedTransactions: number[];
  setSelectedTransactions: (val: number[] | ((prev: number[]) => number[])) => void;
  setBatchPaymentAmounts: (val: Record<number, number>) => void;
  setIsBatchFinanceModalOpen: (val: boolean) => void;
  generateFinancialTransactionReport: (t: Transaction) => void;
  reverseTransaction: (t: Transaction) => void;
  setEditingTransaction: (t: Transaction | null) => void;
  deleteTransaction: (id: number) => void;
  toggleReconciliation: (t: Transaction) => void;
  formatDate: (date: string) => string;
}

export const FinanceView = ({
  financeTab,
  setFinanceTab,
  setIsFinanceModalOpen,
  transactions,
  productionOrders,
  shifts,
  selectedTransactions,
  setSelectedTransactions,
  setBatchPaymentAmounts,
  setIsBatchFinanceModalOpen,
  generateFinancialTransactionReport,
  reverseTransaction,
  setEditingTransaction,
  deleteTransaction,
  toggleReconciliation,
  formatDate
}: FinanceViewProps) => {

  const isOverdueOrCurrentMonth = (t: Transaction) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const targetDateStr = t.dueDate || t.date;
    const tDate = new Date(targetDateStr + 'T12:00:00');
    
    const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    const todayStr = today.toISOString().split('T')[0];
    const isOverdue = t.status !== 'completed' && targetDateStr < todayStr;
    
    return isOverdue || isCurrentMonth;
  };

  return (
    <motion.div 
      key="finance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setFinanceTab('history')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${financeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Fluxo de Caixa
        </button>
        <button 
          onClick={() => setFinanceTab('receivable')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${financeTab === 'receivable' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Contas a Receber
        </button>
        <button 
          onClick={() => setFinanceTab('payable')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${financeTab === 'payable' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Contas a Pagar
        </button>
        <button 
          onClick={() => setFinanceTab('reconciliation')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${financeTab === 'reconciliation' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Conciliação
        </button>
        <button 
          onClick={() => setFinanceTab('dre')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${financeTab === 'dre' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          DRE
        </button>
        <button 
          onClick={() => setFinanceTab('balance')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${financeTab === 'balance' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Balancete
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Saldo em Caixa</p>
              <h3 className="text-2xl font-black text-slate-800">
                R$ {transactions.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">A Receber</p>
              <h3 className="text-2xl font-black text-slate-800">
                R$ {transactions.filter(t => t.type === 'income' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-rose-600 font-bold uppercase tracking-wider">A Pagar</p>
              <h3 className="text-2xl font-black text-slate-800">
                R$ {transactions.filter(t => t.type === 'expense' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-bold uppercase tracking-wider">Pendentes Conciliação</p>
              <h3 className="text-2xl font-black text-slate-800">
                {transactions.filter(t => !t.reconciled).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {financeTab === 'history' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Histórico de Transações</h3>
            <button 
              onClick={() => { setEditingTransaction(null); setIsFinanceModalOpen(true); }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={18} /> Nova Transação
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.filter(isOverdueOrCurrentMonth).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{formatDate(t.date)}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{t.description}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{t.category}</td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : t.status === 'partial' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                        {t.status === 'completed' ? 'Efetivado' : t.status === 'partial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => generateFinancialTransactionReport(t)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Gerar Comprovante PDF"
                        >
                          <FileText size={18} />
                        </button>
                        {t.status === 'partial' && (
                          <button 
                            onClick={() => reverseTransaction(t)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Estornar Pagamento Parcial"
                          >
                            <RotateCcw size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => { setEditingTransaction(t); setIsFinanceModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="p-2 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
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

      {(financeTab === 'payable' || financeTab === 'receivable') && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">{financeTab === 'payable' ? 'Contas a Pagar' : 'Contas a Receber'}</h3>
            {selectedTransactions.length > 0 && (
              <button 
                onClick={() => {
                  const initialAmounts: Record<number, number> = {};
                  selectedTransactions.forEach(id => {
                    const t = transactions.find(trans => trans.id === id);
                    if (t) initialAmounts[id] = t.amount - (t.paidAmount || 0);
                  });
                  setBatchPaymentAmounts(initialAmounts);
                  setIsBatchFinanceModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                <DollarSign size={18} /> {financeTab === 'payable' ? 'Pagar Selecionados' : 'Receber Selecionados'} ({selectedTransactions.length})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransactions(transactions.filter(t => t.type === (financeTab === 'payable' ? 'expense' : 'income') && t.status !== 'completed' && isOverdueOrCurrentMonth(t)).map(t => t.id));
                        } else {
                          setSelectedTransactions([]);
                        }
                      }}
                      checked={selectedTransactions.length > 0 && selectedTransactions.length === transactions.filter(t => t.type === (financeTab === 'payable' ? 'expense' : 'income') && t.status !== 'completed' && isOverdueOrCurrentMonth(t)).length}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Vencimento</th>
                  <th className="px-6 py-4 font-semibold">cliente/funcionário</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor Total</th>
                  <th className="px-6 py-4 font-semibold text-right">Pago</th>
                  <th className="px-6 py-4 font-semibold text-right">Saldo</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter(t => t.type === (financeTab === 'payable' ? 'expense' : 'income') && t.status !== 'completed' && isOverdueOrCurrentMonth(t))
                  .map(t => (
                    <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${selectedTransactions.includes(t.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedTransactions.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransactions(prev => [...prev, t.id]);
                            } else {
                              setSelectedTransactions(prev => prev.filter(id => id !== t.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(t.dueDate || t.date)}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {t.clientName?.trim() || (
                          t.relatedId && t.category === 'Venda de Produção' 
                            ? productionOrders.find(o => o.id === t.relatedId)?.clientName 
                            : null
                        ) || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {t.description}
                        {t.relatedId && t.category === 'Venda de Produção' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-bold uppercase">Produção</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-400">R$ {t.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">R$ {(t.paidAmount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">R$ {(t.amount - (t.paidAmount || 0)).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'partial' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.status === 'partial' ? 'Parcial' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => generateFinancialTransactionReport(t)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Gerar Comprovante PDF"
                          >
                            <FileText size={18} />
                          </button>
                          {t.status === 'partial' && (
                            <button 
                              onClick={() => reverseTransaction(t)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Estornar Pagamento Parcial"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setBatchPaymentAmounts({ [t.id]: t.amount - (t.paidAmount || 0) });
                              setSelectedTransactions([t.id]);
                              setIsBatchFinanceModalOpen(true);
                            }}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                            title="Efetuar Pagamento/Recebimento"
                          >
                            <DollarSign size={18} />
                          </button>
                          <button 
                            onClick={() => { setEditingTransaction(t); setIsFinanceModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteTransaction(t.id)}
                            className="p-2 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={18} />
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

      {financeTab === 'dre' && (
        <div className="card p-6">
          <h3 className="font-bold text-slate-800 mb-6">Demonstrativo de Resultados (DRE)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
              <span className="font-bold text-emerald-800">Receita Bruta (Entradas)</span>
              <span className="font-bold text-emerald-900">
                R$ {(
                  transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                  transactions.filter(t => t.type === 'income' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="pl-4 space-y-2">
              {Array.from(new Set(transactions.filter(t => t.type === 'income' && (t.status === 'completed' || t.status === 'partial')).map(t => t.category))).map(cat => (
                <div key={cat} className="flex justify-between text-sm text-slate-600">
                  <span>{cat}</span>
                  <span>R$ {(
                    transactions.filter(t => t.type === 'income' && t.status === 'completed' && t.category === cat).reduce((acc, t) => acc + t.amount, 0) +
                    transactions.filter(t => t.type === 'income' && t.status === 'partial' && t.category === cat).reduce((acc, t) => acc + (t.paidAmount || 0), 0)
                  ).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
              <span className="font-bold text-red-800">Custos e Despesas (Saídas)</span>
              <span className="font-bold text-red-900">
                R$ {(
                  transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                  transactions.filter(t => t.type === 'expense' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="pl-4 space-y-2">
              {Array.from(new Set(transactions.filter(t => t.type === 'expense' && (t.status === 'completed' || t.status === 'partial')).map(t => t.category))).map(cat => (
                <div key={cat} className="flex justify-between text-sm text-slate-600">
                  <span>{cat}</span>
                  <span>R$ {(
                    transactions.filter(t => t.type === 'expense' && t.status === 'completed' && t.category === cat).reduce((acc, t) => acc + t.amount, 0) +
                    transactions.filter(t => t.type === 'expense' && t.status === 'partial' && t.category === cat).reduce((acc, t) => acc + (t.paidAmount || 0), 0)
                  ).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 mt-6">
              <div className={`flex justify-between items-center p-4 rounded-2xl ${
                ((transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                  transactions.filter(t => t.type === 'income' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)) - 
                 (transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                  transactions.filter(t => t.type === 'expense' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0))) >= 0 
                ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}>
                <span className="text-lg font-bold">Resultado Líquido</span>
                <span className="text-2xl font-bold">
                  R$ {(
                    (transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                     transactions.filter(t => t.type === 'income' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)) - 
                    (transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                     transactions.filter(t => t.type === 'expense' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0))
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {financeTab === 'balance' && (
        <div className="card p-6">
          <h3 className="font-bold text-slate-800 mb-6">Balancete de Verificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-emerald-700 border-b pb-2">Ativos (Disponibilidades)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Saldo em Caixa/Banco (Efetivado)</span>
                  <span className="font-bold">R$ {(
                    transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) - 
                    transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                    transactions.filter(t => t.type === 'income' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0) -
                    transactions.filter(t => t.type === 'expense' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)
                  ).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Contas a Receber (Pendente/Parcial)</span>
                  <span className="font-bold">R$ {transactions.filter(t => t.type === 'income' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t text-emerald-800">
                  <span>Total Ativos</span>
                  <span>R$ {(
                    (transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) - 
                     transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                     transactions.filter(t => t.type === 'income' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0) -
                     transactions.filter(t => t.type === 'expense' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)) +
                    transactions.filter(t => t.type === 'income' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0)
                  ).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-red-700 border-b pb-2">Passivos (Obrigações)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contas a Pagar (Pendente/Parcial)</span>
                  <span className="font-bold">R$ {transactions.filter(t => t.type === 'expense' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Diárias a Pagar</span>
                  <span className="font-bold">R$ {shifts.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t text-red-800">
                  <span>Total Passivos</span>
                  <span>R$ {(
                    transactions.filter(t => t.type === 'expense' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0) +
                    shifts.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0)
                  ).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800">Patrimônio Líquido Estimado</h4>
                <p className="text-xs text-slate-500">Ativos totais menos passivos totais</p>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                R$ {(
                  ((transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) - 
                    transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0) +
                    transactions.filter(t => t.type === 'income' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0) -
                    transactions.filter(t => t.type === 'expense' && t.status === 'partial').reduce((acc, t) => acc + (t.paidAmount || 0), 0)) +
                   transactions.filter(t => t.type === 'income' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0)) -
                  (transactions.filter(t => t.type === 'expense' && t.status !== 'completed').reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0) +
                   shifts.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0))
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {financeTab === 'reconciliation' && (
        <div className="card">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Conciliação Bancária</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor</th>
                  <th className="px-6 py-4 font-semibold text-center">Conciliado</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter(t => t.status === 'completed')
                  .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{t.description}</td>
                      <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        R$ {t.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {t.reconciled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 size={14} /> Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs">
                            <Clock size={14} /> Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => toggleReconciliation(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${t.reconciled ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'}`}
                          >
                            {t.reconciled ? 'Desfazer' : 'Conciliar'}
                          </button>
                          <button 
                            onClick={() => deleteTransaction(t.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 size={18} />
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
    </motion.div>
  );
};
