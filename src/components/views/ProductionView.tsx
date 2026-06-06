import React from 'react';
import { 
  Package, 
  Scissors, 
  Wrench, 
  Plus, 
  Trash2, 
  ChevronRight, 
  DollarSign, 
  Edit2, 
  FileText, 
  Users, 
  Image,
  CheckCircle2,
  User,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ProductionOrder, 
  Repair, 
  Product, 
  Client, 
  ProductionStep, 
  Transaction, 
  Employee,
  OrderItem
} from '../../types';
import { formatDate } from '../../lib/utils';

interface ProductionViewProps {
  productionTab: 'orders' | 'products' | 'repairs';
  setProductionTab: (val: 'orders' | 'products' | 'repairs') => void;
  selectedProductionOrderId: number | null;
  setSelectedProductionOrderId: (val: number | null) => void;
  repairs: Repair[];
  products: Product[];
  productionOrders: ProductionOrder[];
  productionSteps: ProductionStep[];
  clients: Client[];
  transactions: Transaction[];
  employees: Employee[];
  searchTerm: string;
  setIsRepairModalOpen: (val: boolean) => void;
  setRepairItemsBreakdown: (val: any[]) => void;
  deleteRepair: (id: number) => void;
  getOrderStats: (orderId: number) => any;
  setIsProductionStepModalOpen: (val: boolean) => void;
  setPendingFinanceOrder: (order: ProductionOrder | null) => void;
  setIsOrderFinanceModalOpen: (val: boolean) => void;
  setEditingProductionOrder: (order: ProductionOrder | null) => void;
  setOrderItems: (items: OrderItem[]) => void;
  setItemsBreakdown: (val: any[]) => void;
  setSelectedProductIdForOrder: (val: number | null) => void;
  setIsProductionOrderModalOpen: (val: boolean) => void;
  advanceOrderStatus: (order: ProductionOrder) => void;
  exportIndividualProductionOrderPDF: (order: ProductionOrder) => void;
  deleteProductionStep: (id: number) => void;
  priorityLabels: { [key: string]: string };
  deleteProductionOrder: (id: number) => void;
  setEditingProduct: (product: Product | null) => void;
  setIsProductModalOpen: (val: boolean) => void;
  deleteProduct: (product: Product) => void;
}

export const ProductionView = ({
  productionTab,
  setProductionTab,
  selectedProductionOrderId,
  setSelectedProductionOrderId,
  repairs,
  products,
  productionOrders,
  productionSteps,
  clients,
  transactions,
  employees,
  searchTerm,
  setIsRepairModalOpen,
  setRepairItemsBreakdown,
  deleteRepair,
  getOrderStats,
  setIsProductionStepModalOpen,
  setPendingFinanceOrder,
  setIsOrderFinanceModalOpen,
  setEditingProductionOrder,
  setOrderItems,
  setItemsBreakdown,
  setSelectedProductIdForOrder,
  setIsProductionOrderModalOpen,
  advanceOrderStatus,
  exportIndividualProductionOrderPDF,
  deleteProductionStep,
  priorityLabels,
  deleteProductionOrder,
  setEditingProduct,
  setIsProductModalOpen,
  deleteProduct
}: ProductionViewProps) => {

  return (
    <motion.div 
      key="production"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1 w-full">
          <button 
            onClick={() => { setProductionTab('orders'); setSelectedProductionOrderId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 min-w-[140px] ${productionTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package size={18} />
            Ordens de Produção
          </button>
          <button 
            onClick={() => { setProductionTab('products'); setSelectedProductionOrderId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 min-w-[140px] ${productionTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Scissors size={18} />
            Cadastro de Produtos
          </button>
          <button 
            onClick={() => { setProductionTab('repairs'); setSelectedProductionOrderId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 min-w-[140px] ${productionTab === 'repairs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Wrench size={18} />
            Concertos
          </button>
        </div>
      </div>

      {productionTab === 'repairs' ? (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Concertos Registrados</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setRepairItemsBreakdown([]); setIsRepairModalOpen(true); }}
                className="btn-primary py-1.5 text-xs"
              >
                <Plus size={14} className="mr-1" /> Novo Concerto
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Data</th>
                  <th className="px-6 py-3 font-semibold">Produto</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Cor / Tam</th>
                  <th className="px-6 py-3 font-semibold text-right">Qtd</th>
                  <th className="px-6 py-3 font-semibold">Notas</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">Nenhum concerto registrado.</td>
                  </tr>
                ) : (
                  repairs.map(repair => (
                    <tr key={repair.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-500">{formatDate(repair.date)}</td>
                      <td className="px-6 py-3 font-medium text-slate-700">
                        {products.find(p => p.id === repair.productId)?.name || 'Produto não encontrado'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          repair.type === 'entry' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {repair.type === 'entry' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {repair.color} / {repair.size}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-indigo-600">{repair.quantity} pçs</td>
                      <td className="px-6 py-3 text-slate-500 max-w-xs truncate">{repair.notes || '-'}</td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => deleteRepair(repair.id)}
                          className="p-1.5 text-slate-300 hover:text-red-600 rounded-md"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : productionTab === 'orders' ? (
        selectedProductionOrderId ? (
        // Detailed View
        <div className="space-y-6">
          {(() => {
            const order = productionOrders.find(o => o.id === selectedProductionOrderId);
            if (!order) return null;
            const stats = getOrderStats(order.id);
            const hasFinance = transactions.some(t => t.relatedId === order.id && t.category === 'Venda de Produção');
            
            return (
              <>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedProductionOrderId(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
                  >
                    <ChevronRight className="rotate-180" size={20} /> Voltar para Lista
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsProductionStepModalOpen(true)}
                      className="btn-primary py-2 bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
                    >
                      <Plus size={16} className="mr-2" /> Lançar Produção
                    </button>
                    {order.status === 'completed' && !hasFinance && (
                      <button 
                        onClick={() => { setPendingFinanceOrder(order); setIsOrderFinanceModalOpen(true); }}
                        className="btn-primary py-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      >
                        <DollarSign size={16} className="mr-2" /> Lançar Financeiro
                      </button>
                    )}
                    <button 
                      onClick={() => { 
                        setEditingProductionOrder(order); 
                        setOrderItems(order.items || []);
                        setIsProductionOrderModalOpen(true); 
                      }}
                      className="btn-secondary py-2"
                    >
                      <Edit2 size={16} className="mr-2" /> Editar Ordem
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Package size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Status Atual</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                            order.status === 'planning' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {order.status === 'planning' ? 'Planejamento' :
                             order.status === 'cutting' ? 'Corte' :
                             order.status === 'sewing' ? 'Costura' :
                             order.status === 'finishing' ? 'Acabamento' : 'Finalizado'}
                          </span>
                          {order.status !== 'completed' && (
                            <button 
                              onClick={() => advanceOrderStatus(order)}
                              className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
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
                        <h3 className="text-2xl font-black text-slate-800">{order.totalPieces}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-bold uppercase tracking-wider">Cliente</p>
                        <h3 className="text-lg font-bold text-slate-800 truncate max-w-[150px]">
                          {clients.find(c => c.id === order.clientId)?.name || '-'}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Data Início</p>
                        <h3 className="text-lg font-bold text-slate-800">{formatDate(order.startDate)}</h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Package size={18} className="text-indigo-600" /> Rastreamento de Peças por Etapa
                      </h3>
                      
                      <div className="space-y-8">
                        {order.items && order.items.length > 0 && (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Grade de Peças (Produtos, Cores e Tamanhos)</p>
                            <div className="space-y-4">
                              {order.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="space-y-2">
                                  <p className="text-xs font-bold text-slate-600">{item.productName}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {item.itemsBreakdown.map((b, idx) => (
                                      <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate w-full">{b.color}</p>
                                        <p className="text-xs font-medium text-slate-700">{b.size}</p>
                                        <p className="text-sm font-bold text-indigo-600 mt-1">{b.quantity} pçs</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {[
                          { label: 'Corte', count: stats.cutting, color: 'bg-blue-500' },
                          { label: 'Costura', count: stats.sewing, color: 'bg-indigo-500' },
                          { label: 'Acabamento', count: stats.finishing, color: 'bg-emerald-500' }
                        ].map(stage => (
                          <div key={stage.label} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-slate-700">{stage.label}</span>
                              <span className="text-sm font-bold text-slate-500">
                                {stage.count} / {order.totalPieces} <span className="text-[10px] ml-1">({Math.round((stage.count / order.totalPieces) * 100)}%)</span>
                              </span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (stage.count / order.totalPieces) * 100)}%` }}
                                className={`h-full ${stage.color}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Histórico de Produção</h3>
                        <button 
                          onClick={() => {
                            setSelectedProductionOrderId(order.id);
                            setIsProductionStepModalOpen(true);
                          }}
                          className="btn-primary py-1.5 text-xs"
                        >
                          <Plus size={14} className="mr-1" /> Lançar Produção
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-3 font-semibold">Data</th>
                              <th className="px-6 py-3 font-semibold">Funcionário</th>
                              <th className="px-6 py-3 font-semibold">Etapa</th>
                              <th className="px-6 py-3 font-semibold text-right">Quantidade</th>
                              <th className="px-6 py-3 font-semibold text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {productionSteps.filter(s => s.orderId === order.id).map(step => (
                              <tr key={step.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 text-slate-500">{formatDate(step.date)}</td>
                                <td className="px-6 py-3 font-medium text-slate-700">{step.employeeName}</td>
                                <td className="px-6 py-3">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                    {step.stepType}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right font-bold text-indigo-600">{step.quantity} pçs</td>
                                <td className="px-6 py-3 text-right">
                                  <button 
                                    onClick={() => deleteProductionStep(step.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-600 rounded-md"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="card p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" /> Alocação de Recursos
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">Funcionários que contribuíram para esta ordem.</p>
                      <div className="space-y-4">
                        {stats.allocatedEmployees.map((emp: any) => (
                          <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                {emp.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{emp.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-indigo-600">{emp.totalProduced} pçs</p>
                              <p className="text-[9px] text-slate-400">Total</p>
                            </div>
                          </div>
                        ))}
                        {stats.allocatedEmployees.length === 0 && (
                          <p className="text-center py-4 text-slate-400 text-sm italic">Nenhum funcionário alocado ainda.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        // List View
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Total de Ordens</p>
                  <h3 className="text-2xl font-black text-slate-800">{productionOrders.length}</h3>
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
                    {productionOrders.reduce((acc, curr) => acc + curr.totalPieces, 0)}
                  </h3>
                </div>
              </div>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-bold uppercase tracking-wider">Em Produção</p>
                  <h3 className="text-2xl font-black text-slate-800">
                    {productionOrders.filter(o => o.status !== 'completed').length}
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
                  <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">Concluídas</p>
                  <h3 className="text-2xl font-black text-slate-800">
                    {productionOrders.filter(o => o.status === 'completed').length}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Ordens de Produção</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Descrição</th>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Produto</th>
                      <th className="px-6 py-4 font-semibold">Prioridade</th>
                      <th className="px-6 py-4 font-semibold text-center">Peças</th>
                      <th className="px-6 py-4 font-semibold">Status de Produção</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productionOrders.map(order => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedProductionOrderId(order.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {order.orderNumber && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-mono font-bold">
                                #{order.orderNumber}
                              </span>
                            )}
                            <p className="font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{order.description}</p>
                          </div>
                          <p className="text-[10px] text-slate-400">Início: {formatDate(order.startDate)}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {clients.find(c => c.id === order.clientId)?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {order.items?.map(i => i.productName).join(', ') || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              order.priority === 'high' ? 'bg-rose-500 animate-pulse' :
                              order.priority === 'medium' ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`} />
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              order.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                              order.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {priorityLabels[order.priority] || order.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-700">{order.totalPieces}</span>
                            {(() => {
                              const stats = getOrderStats(order.id);
                              const totalProduced = stats.cutting + stats.sewing + stats.finishing;
                              const percent = Math.min(100, Math.round((totalProduced / (order.totalPieces * 3)) * 100));
                              return (
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }} />
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                order.status === 'planning' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {order.status === 'planning' ? 'Planejamento' :
                                 order.status === 'cutting' ? 'Corte' :
                                 order.status === 'sewing' ? 'Costura' :
                                 order.status === 'finishing' ? 'Acabamento' : 'Finalizado'}
                              </span>
                              {order.status !== 'completed' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); advanceOrderStatus(order); }}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                  title="Avançar Etapa"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              )}
                            </div>
                            {transactions.some(t => t.relatedId === order.id && t.category === 'Venda de Produção') && (
                              <div className="flex items-center justify-center w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100" title="Financeiro Lançado">
                                <DollarSign size={12} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => exportIndividualProductionOrderPDF(order)}
                              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
                              title="Gerar Relatório Detalhado"
                            >
                              <FileText size={18} />
                            </button>
                            <button 
                              onClick={() => { 
                                setEditingProductionOrder(order); 
                                setOrderItems(order.items || []);
                                setItemsBreakdown([]);
                                setSelectedProductIdForOrder(null);
                                setIsProductionOrderModalOpen(true); 
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => deleteProductionOrder(order.id)}
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
          </div>

          <div className="space-y-6">
            <div className="card p-6 bg-indigo-600 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package size={20} />
                </div>
                <h3 className="font-bold">Resumo Geral</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-white/70 text-sm">Total Produzido</span>
                  <span className="font-bold text-xl">{productionSteps.reduce((acc, s) => acc + s.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-white/70 text-sm">Ordens Ativas</span>
                  <span className="font-bold">{productionOrders.filter(o => o.status !== 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Peças Pendentes</span>
                  <span className="font-bold">
                    {productionOrders.filter(o => o.status !== 'completed').reduce((acc, o) => acc + o.totalPieces, 0) - productionSteps.reduce((acc, s) => acc + s.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">Últimos Lançamentos</h3>
              </div>
              <div className="p-4 space-y-4">
                {productionSteps.slice(0, 5).map(step => (
                    <div key={step.id} className="flex justify-between items-center text-sm group">
                      <div>
                        <p className="font-medium text-slate-700">{step.employeeName}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{step.stepType}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">{step.quantity} pçs</p>
                          <p className="text-[10px] text-slate-400">{formatDate(step.date)}</p>
                        </div>
                        <button 
                          onClick={() => deleteProductionStep(step.id)}
                          className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                ))}
                {productionSteps.length === 0 && (
                  <p className="text-center py-4 text-slate-400 text-xs italic">Nenhum lançamento recente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )) : (
        // Products List View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map(product => (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card group overflow-hidden hover:shadow-xl transition-all border-slate-200 hover:border-indigo-200"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {product.photos && product.photos.length > 0 ? (
                  <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Image size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm text-slate-600 hover:text-indigo-600 rounded-xl transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteProduct(product)}
                    className="p-2 bg-white/90 backdrop-blur shadow-sm text-slate-600 hover:text-red-600 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {product.category && (
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {product.category}
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">SKU: {product.sku || 'N/A'}</p>
                </div>
                
                {product.technicalSheet && (
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed italic">
                      {product.technicalSheet}
                    </p>
                  </div>
                )}

                {(product.colors?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.colors?.map((c, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-medium border border-indigo-100">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {(product.sizes?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.sizes?.map((s, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex -space-x-2">
                    {product.photos && product.photos.map((photo, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-slate-100">
                        <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Scissors className="text-slate-300" size={32} />
              </div>
              <h3 className="text-slate-800 font-bold">Nenhum produto cadastrado</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">
                Comece cadastrando seus produtos para gerenciar a produção de forma mais eficiente.
              </p>
              <button 
                onClick={() => { setEditingProduct({ id: 0, name: '', photos: [], colors: [], sizes: [], active: true }); setIsProductModalOpen(true); }}
                className="mt-6 btn-primary inline-flex"
              >
                <Plus size={20} className="mr-2" /> Cadastrar Primeiro Produto
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
