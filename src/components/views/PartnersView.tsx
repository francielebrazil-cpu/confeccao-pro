import React from 'react';
import { 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Client, 
  Employee, 
  DailyShift 
} from '../../types';

interface PartnersViewProps {
  partnerTab: 'clients' | 'employees';
  setPartnerTab: (val: 'clients' | 'employees') => void;
  clients: Client[];
  employees: Employee[];
  shifts: DailyShift[];
  searchTerm: string;
  setEditingClient: (client: Client | null) => void;
  setIsClientModalOpen: (val: boolean) => void;
  deleteClient: (id: number) => void;
  setEditingEmployee: (emp: Employee | null) => void;
  setIsEmployeeModalOpen: (val: boolean) => void;
  deleteEmployee: (id: number) => void;
}

export const PartnersView = ({
  partnerTab,
  setPartnerTab,
  clients,
  employees,
  shifts,
  searchTerm,
  setEditingClient,
  setIsClientModalOpen,
  deleteClient,
  setEditingEmployee,
  setIsEmployeeModalOpen,
  deleteEmployee
}: PartnersViewProps) => {

  return (
    <motion.div 
      key="partners"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setPartnerTab('clients')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${partnerTab === 'clients' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Clientes
        </button>
        <button 
          onClick={() => setPartnerTab('employees')}
          className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${partnerTab === 'employees' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Funcionários
        </button>
      </div>

      {partnerTab === 'clients' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients
            .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(client => (
            <div key={client.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                  {client.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingClient(client); setIsClientModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteClient(client.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-800">{client.name}</h3>
              <p className="text-slate-500 text-sm">{client.email || 'Sem e-mail'}</p>
              <p className="text-slate-500 text-sm mb-4">{client.phone || 'Sem telefone'}</p>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Endereço</p>
                <p className="text-xs text-slate-600 truncate">{client.address || 'Não informado'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees
            .filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(emp => {
              const pendingAmount = shifts
                .filter(s => s.employeeId === emp.id && s.status === 'pending')
                .reduce((acc, s) => acc + s.amount, 0);
              
              return (
                <div key={emp.id} className="card p-6 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingEmployee(emp); setIsEmployeeModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteEmployee(emp.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{emp.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{emp.role}</p>
                  
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Valor Diária</span>
                      <span className="font-bold text-slate-700 text-sm">R$ {emp.dailyRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">A Pagar</span>
                      <span className={`font-bold text-sm ${pendingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        R$ {pendingAmount.toFixed(2)}
                      </span>
                    </div>
                    {emp.cpf && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">CPF</span>
                        <span className="text-slate-600 text-xs font-medium">{emp.cpf}</span>
                      </div>
                    )}
                    {emp.pix_key && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">PIX</span>
                        <span className="text-slate-600 text-xs font-medium truncate max-w-[150px]" title={emp.pix_key}>{emp.pix_key}</span>
                      </div>
                    )}
                    {emp.address && (
                      <div className="pt-2">
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block mb-1">Endereço</span>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">{emp.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          {employees.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400">
              Nenhum funcionário cadastrado.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
