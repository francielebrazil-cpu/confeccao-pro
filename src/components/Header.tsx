import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from './Button';

interface HeaderProps {
  view: string;
  partnerTab: string;
  productionTab: string;
  setEditingShift: (val: any) => void;
  setIsShiftModalOpen: (val: boolean) => void;
  setEditingProductionOrder: (val: any) => void;
  setItemsBreakdown: (val: any) => void;
  setSelectedProductIdForOrder: (val: any) => void;
  setIsProductionOrderModalOpen: (val: boolean) => void;
  setRepairItemsBreakdown: (val: any) => void;
  setIsRepairModalOpen: (val: boolean) => void;
  setEditingProduct: (val: any) => void;
  setIsProductModalOpen: (val: boolean) => void;
  setPartnerTab: (val: any) => void;
  setEditingClient: (val: any) => void;
  setIsClientModalOpen: (val: boolean) => void;
  setEditingEmployee: (val: any) => void;
  setIsEmployeeModalOpen: (val: boolean) => void;
  setIsFinanceModalOpen: (val: boolean) => void;
}

export const Header = ({
  view,
  partnerTab,
  productionTab,
  setEditingShift,
  setIsShiftModalOpen,
  setEditingProductionOrder,
  setItemsBreakdown,
  setSelectedProductIdForOrder,
  setIsProductionOrderModalOpen,
  setRepairItemsBreakdown,
  setIsRepairModalOpen,
  setEditingProduct,
  setIsProductModalOpen,
  setPartnerTab,
  setEditingClient,
  setIsClientModalOpen,
  setEditingEmployee,
  setIsEmployeeModalOpen,
  setIsFinanceModalOpen
}: HeaderProps) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">
          {view === 'dashboard' && 'Painel Geral'}
          {view === 'shifts' && 'Diária'}
          {view === 'reports' && 'Relatórios e Horas'}
          {view === 'production' && 'Controle de Produção'}
          {view === 'partners' && (partnerTab === 'employees' ? 'Gerenciar Funcionários' : 'Clientes e Fornecedores')}
          {view === 'finance' && 'Controle Financeiro'}
          {view === 'settings' && 'Configurações do Sistema'}
        </h2>
        <p className="text-slate-500 text-sm md:text-base">Bem-vindo ao sistema de gestão</p>
      </div>
      
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        {view === 'shifts' && (
          <Button 
            variant="success"
            onClick={() => { setEditingShift(null); setIsShiftModalOpen(true); }}
            className="w-full font-bold uppercase tracking-wider"
            leftIcon={<Plus size={18} />}
          >
            LANÇAR DIÁRIA
          </Button>
        )}
        {view === 'production' && (
          <div className="flex flex-col gap-2 w-full">
            {productionTab === 'orders' ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => { 
                    setEditingProductionOrder(null); 
                    setItemsBreakdown([]);
                    setSelectedProductIdForOrder(null);
                    setIsProductionOrderModalOpen(true); 
                  }}
                  className="w-full font-bold uppercase tracking-wider"
                  leftIcon={<Plus size={18} />}
                >
                  NOVA ORDEM
                </Button>
                <Button 
                  variant="success"
                  onClick={() => { setRepairItemsBreakdown([]); setIsRepairModalOpen(true); }}
                  className="w-full font-bold uppercase tracking-wider"
                  leftIcon={<Plus size={18} />}
                >
                  CONCERTO
                </Button>
              </>
            ) : productionTab === 'repairs' ? (
              <Button 
                variant="success"
                onClick={() => { setRepairItemsBreakdown([]); setIsRepairModalOpen(true); }}
                className="w-full font-bold uppercase tracking-wider"
                leftIcon={<Plus size={18} />}
              >
                NOVO CONCERTO
              </Button>
            ) : (
              <Button 
                variant="success"
                onClick={() => { setEditingProduct({ id: 0, name: '', photos: [], colors: [], sizes: [], active: true }); setIsProductModalOpen(true); }}
                className="w-full font-bold uppercase tracking-wider"
                leftIcon={<Plus size={18} />}
              >
                NOVO PRODUTO
              </Button>
            )}
          </div>
        )}
        {view === 'partners' && (
          <div className="flex flex-col gap-2 w-full">
            <Button 
              variant="success"
              onClick={() => { setPartnerTab('clients'); setEditingClient(null); setIsClientModalOpen(true); }}
              className="w-full font-bold uppercase tracking-wider"
              leftIcon={<Plus size={18} />}
            >
              NOVO CLIENTE
            </Button>
            <Button 
              variant="primary"
              onClick={() => { setPartnerTab('employees'); setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
              className="w-full font-bold uppercase tracking-wider"
              leftIcon={<Plus size={18} />}
            >
              NOVO FUNCIONÁRIO
            </Button>
          </div>
        )}
        {view === 'finance' && (
          <Button 
            variant="success"
            onClick={() => setIsFinanceModalOpen(true)}
            className="w-full font-bold uppercase tracking-wider"
            leftIcon={<Plus size={18} />}
          >
            NOVA TRANSAÇÃO
          </Button>
        )}
      </div>
    </header>
  );
};
