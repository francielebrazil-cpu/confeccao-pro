import { useState, useEffect, useCallback } from 'react';
import { 
  Employee, 
  DailyShift, 
  User, 
  Client, 
  ProductionOrder, 
  ProductionStep, 
  FinancialTransaction,
  Product,
  OrderItem,
  Defect,
  Repair,
  CompanySettings
} from '../types';

export function useAppData() {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<(DailyShift & { employeeName?: string })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [productionSteps, setProductionSteps] = useState<ProductionStep[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({ id: 1, name: 'Confecção Pro' });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Editing states
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingShift, setEditingShift] = useState<DailyShift | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductionOrder, setEditingProductionOrder] = useState<ProductionOrder | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [itemsBreakdown, setItemsBreakdown] = useState<{ color: string, size: string, quantity: number }[]>([]);
  const [repairItemsBreakdown, setRepairItemsBreakdown] = useState<{ color: string, size: string, quantity: number }[]>([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedShift, setSelectedShift] = useState<DailyShift | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  const fetchCompanySettings = useCallback(async () => {
    try {
      const res = await fetch('/api/company-settings');
      const data = await res.json();
      if (data && !data.error) {
        setCompanySettings(data);
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [empRes, shiftRes, clientRes, productRes, orderRes, stepRes, financeRes, defectRes, repairRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/shifts'),
        fetch('/api/clients'),
        fetch('/api/products'),
        fetch('/api/production-orders'),
        fetch('/api/production-steps'),
        fetch('/api/financial-transactions'),
        fetch('/api/defects'),
        fetch('/api/repairs')
      ]);
      
      const empData = await empRes.json();
      const shiftData = await shiftRes.json();
      const clientData = await clientRes.json();
      const productData = await productRes.json();
      const orderData = await orderRes.json();
      const stepData = await stepRes.json();
      const financeData = await financeRes.json();
      const defectData = await defectRes.json();
      const repairData = await repairRes.json();
      
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(shiftData)) setShifts(shiftData);
      if (Array.isArray(clientData)) setClients(clientData);
      if (Array.isArray(productData)) setProducts(productData);
      if (Array.isArray(orderData)) setProductionOrders(orderData);
      if (Array.isArray(stepData)) setProductionSteps(stepData);
      if (Array.isArray(financeData)) setTransactions(financeData);
      if (Array.isArray(defectData)) setDefects(defectData);
      if (Array.isArray(repairData)) setRepairs(repairData);
      
      await fetchCompanySettings();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }, [user, fetchCompanySettings]);

  // CRUD Handlers
  const saveClient = async (data: any) => {
    // Duplicate check
    const isDuplicate = clients.some(c => 
      c.name.toLowerCase() === data.name.toLowerCase() && 
      (!editingClient || c.id !== editingClient.id)
    );

    if (isDuplicate) {
      setError('Já existe um cliente com este nome.');
      return false;
    }

    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';
    const response = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (response.ok) {
      setEditingClient(null);
      setModalOpen(null);
      await fetchData();
      setSuccess('Cliente salvo com sucesso!');
      return true;
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar cliente');
      return false;
    }
  };

  const deleteClient = async (id: number) => {
    const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchData();
      setSuccess('Cliente excluído com sucesso!');
      return true;
    }
    return false;
  };

  const saveProduct = async (data: any) => {
    // Duplicate check
    const isDuplicate = products.some(p => 
      (p.name.toLowerCase() === data.name.toLowerCase() || p.sku.toLowerCase() === data.sku.toLowerCase()) && 
      (!editingProduct || p.id !== editingProduct.id)
    );

    if (isDuplicate) {
      setError('Já existe um produto com este nome ou SKU.');
      return false;
    }

    const url = editingProduct && editingProduct.id !== 0 ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct && editingProduct.id !== 0 ? 'PUT' : 'POST';
    const response = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (response.ok) {
      setEditingProduct(null);
      setModalOpen(null);
      await fetchData();
      setSuccess('Produto salvo com sucesso!');
      return true;
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar produto');
      return false;
    }
  };

  const deleteProduct = async (id: number) => {
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchData();
      setSuccess('Produto excluído com sucesso!');
      return true;
    } else {
      const data = await response.json();
      setError(data.error || 'Erro ao excluir produto');
      return false;
    }
  };

  const saveProductionOrder = async (data: any) => {
    const url = editingProductionOrder ? `/api/production-orders/${editingProductionOrder.id}` : '/api/production-orders';
    const method = editingProductionOrder ? 'PUT' : 'POST';
    const response = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (response.ok) {
      const savedOrder = await response.json();
      setEditingProductionOrder(null);
      setItemsBreakdown([]);
      setModalOpen(null);
      await fetchData();
      setSuccess('Ordem de produção salva com sucesso!');
      return { success: true, order: savedOrder };
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar ordem de produção');
      return { success: false };
    }
  };

  const updateProductionOrder = async (id: number, data: any) => {
    const response = await fetch(`/api/production-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      await fetchData();
      return true;
    }
    return false;
  };

  const deleteProductionOrder = async (id: number) => {
    const response = await fetch(`/api/production-orders/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchData();
      setSuccess('Ordem de produção excluída!');
      return true;
    }
    return false;
  };

  const saveProductionStep = async (data: any) => {
    const response = await fetch('/api/production-steps', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (response.ok) {
      await fetchData();
      setSuccess('Produção lançada com sucesso!');
      return true;
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar etapa de produção');
      return false;
    }
  };

  const deleteProductionStep = async (id: number) => {
    const response = await fetch(`/api/production-steps/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchData();
      setSuccess('Lançamento excluído!');
      return true;
    }
    return false;
  };

  const saveTransaction = async (data: any) => {
    // Duplicate check for transactions
    const isDuplicate = transactions.some(t => 
      t.description === data.description && 
      t.amount === data.amount && 
      t.date === data.date &&
      (!editingTransaction || t.id !== editingTransaction.id)
    );

    if (isDuplicate) {
      setError('Já existe uma transação idêntica registrada hoje.');
      return false;
    }

    const url = editingTransaction ? `/api/financial-transactions/${editingTransaction.id}` : '/api/financial-transactions';
    const method = editingTransaction ? 'PUT' : 'POST';
    const response = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    if (response.ok) {
      setEditingTransaction(null);
      setModalOpen(null);
      await fetchData();
      setSuccess('Transação salva com sucesso!');
      return true;
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar transação');
      return false;
    }
  };

  const updateTransaction = async (id: number, data: any) => {
    const response = await fetch(`/api/financial-transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      await fetchData();
      return true;
    }
    return false;
  };

  const deleteTransaction = async (id: number) => {
    const response = await fetch(`/api/financial-transactions/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchData();
      setSuccess('Transação excluída!');
      return true;
    }
    return false;
  };

  const saveEmployee = async (data: any) => {
    // Duplicate check
    const isDuplicate = employees.some(e => 
      e.name.toLowerCase() === data.name.toLowerCase() && 
      (!editingEmployee || e.id !== editingEmployee.id)
    );

    if (isDuplicate) {
      setError('Já existe um funcionário com este nome.');
      return false;
    }

    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      setEditingEmployee(null);
      setModalOpen(null);
      await fetchData();
      return true;
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar funcionário');
      return false;
    }
  };

  const deleteEmployee = async (id: number) => {
    const res = await fetch(`/api/employees/${id}`, { 
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      await fetchData();
      setSuccess('Funcionário excluído!');
      return true;
    } else {
      const errorData = await res.json().catch(() => ({}));
      setError('Não foi possível excluir o funcionário: ' + (errorData.message || 'Erro no servidor'));
      return false;
    }
  };

  const saveShift = async (data: any) => {
    // Duplicate check for shifts
    const isDuplicate = shifts.some(s => 
      s.employeeId === data.employeeId && 
      s.date === data.date &&
      (!editingShift || s.id !== editingShift.id)
    );

    if (isDuplicate) {
      setError('Este funcionário já possui uma diária registrada nesta data.');
      return false;
    }

    const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
    const method = editingShift ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      setEditingShift(null);
      setModalOpen(null);
      await fetchData();
      return true;
    }
    return false;
  };

  const updateShift = async (id: number, data: any) => {
    const response = await fetch(`/api/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      await fetchData();
      return true;
    }
    return false;
  };

  const deleteShift = async (id: number) => {
    const res = await fetch(`/api/shifts/${id}`, { 
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      await fetchData();
      setSuccess('Diária excluída!');
      return true;
    }
    return false;
  };

  const bulkDeleteShifts = async (ids: number[]) => {
    const res = await fetch('/api/shifts/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (res.ok) {
      await fetchData();
      setSuccess('Registros excluídos com sucesso!');
      return true;
    }
    return false;
  };

  const saveDefect = async (data: any) => {
    const res = await fetch('/api/defects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      await fetchData();
      setSuccess('Defeito registrado com sucesso!');
      return true;
    }
    return false;
  };

  const deleteDefect = async (id: number) => {
    const res = await fetch(`/api/defects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
      return true;
    }
    return false;
  };

  const saveRepair = async (data: any) => {
    const res = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setRepairItemsBreakdown([]);
      setModalOpen(null);
      await fetchData();
      setSuccess('Concerto registrado com sucesso!');
      return true;
    }
    return false;
  };

  const deleteRepair = async (id: number) => {
    const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
      setSuccess('Concerto excluído com sucesso!');
      return true;
    }
    return false;
  };

  const updateCompanySettings = async (data: any) => {
    const res = await fetch('/api/company-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      await fetchCompanySettings();
      setSuccess('Configurações atualizadas com sucesso!');
      return true;
    }
    return false;
  };

  const resetSystem = async () => {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      await fetchData();
      return true;
    }
    return false;
  };

  const handleLogin = async (username: string, password: string) => {
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setError('');
        return true;
      } else {
        setError(data.message || data.error || 'Usuário ou senha incorretos');
        return false;
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      setError('Erro de conexão. Verifique se o servidor está rodando e se o Supabase está configurado corretamente.');
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const updateUser = async (data: any) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user?.id, 
          ...data
        })
      });
      const resData = await res.json();
      if (resData.success) {
        setSuccess('Dados atualizados com sucesso! Por favor, faça login novamente.');
        return true;
      } else {
        setError(resData.error || resData.message || 'Erro ao atualizar dados');
        return false;
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
      return false;
    }
  };

  const advanceOrderStatus = async (order: ProductionOrder) => {
    const flow = ['planning', 'cutting', 'sewing', 'finishing', 'completed'];
    const currentIndex = flow.indexOf(order.status);
    if (currentIndex < flow.length - 1) {
      const nextStatus = flow[currentIndex + 1];
      const updated = await updateProductionOrder(order.id, { status: nextStatus });
      if (updated) {
        if (nextStatus === 'completed') {
          setSelectedOrder(order);
          setModalOpen('launchFinance');
        }
        setSuccess(`Status atualizado para ${nextStatus}`);
      }
    }
  };

  const launchFinanceFromOrder = async (order: ProductionOrder, isPaid: boolean) => {
    const transactionData = {
      type: 'income',
      category: 'Venda de Produção',
      amount: order.totalValue,
      date: new Date().toISOString().split('T')[0],
      description: `Venda Ref. OP #${order.id} - ${order.items?.map(i => i.productName).join(', ')}`,
      status: isPaid ? 'completed' : 'pending',
      orderId: order.id
    };
    const saved = await saveTransaction(transactionData);
    if (saved) {
      setModalOpen(null);
      setSuccess('Financeiro lançado com sucesso!');
    }
  };

  const toggleShiftStatus = async (shift: DailyShift) => {
    const newStatus = shift.status === 'pending' ? 'paid' : 'pending';
    const updated = await updateShift(shift.id, { status: newStatus });
    if (updated) {
      if (newStatus === 'paid') {
        const transactionData = {
          type: 'expense',
          category: 'Mão de Obra',
          amount: shift.amount,
          date: new Date().toISOString().split('T')[0],
          description: `Pagamento Diária #${shift.id} - ${employees.find(e => e.id === shift.employeeId)?.name || 'N/A'}`,
          status: 'completed',
          shiftId: shift.id
        };
        await saveTransaction(transactionData);
      } else {
        const transaction = transactions.find(t => t.shiftId === shift.id);
        if (transaction) {
          await deleteTransaction(transaction.id);
        }
      }
      setSuccess(`Status da diária atualizado para ${newStatus}`);
    }
  };

  const processBulkPayShifts = async (selectedShiftIds: number[]) => {
    const shiftsToPay = shifts.filter(s => selectedShiftIds.includes(s.id) && s.status === 'pending');
    if (shiftsToPay.length === 0) return;

    const byEmployee: Record<number, { total: number, ids: number[], name: string }> = {};
    shiftsToPay.forEach(s => {
      if (!byEmployee[s.employeeId]) {
        byEmployee[s.employeeId] = { total: 0, ids: [], name: s.employeeName || 'Funcionário' };
      }
      byEmployee[s.employeeId].total += s.totalValue;
      byEmployee[s.employeeId].ids.push(s.id);
    });

    for (const empId in byEmployee) {
      const data = byEmployee[empId];
      const transactionData = {
        type: 'expense',
        category: 'Mão de Obra',
        amount: data.total,
        date: new Date().toISOString().split('T')[0],
        description: `Pagamento Lote Diárias - ${data.name} (${data.ids.length} diárias)`,
        status: 'completed'
      };
      
      const saved = await saveTransaction(transactionData);
      if (saved) {
        for (const sId of data.ids) {
          await updateShift(sId, { status: 'paid' });
        }
      }
    }
    setSuccess('Pagamentos em lote processados com sucesso!');
  };

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return {
    user, setUser,
    employees, setEmployees,
    shifts, setShifts,
    clients, setClients,
    products, setProducts,
    productionOrders, setProductionOrders,
    productionSteps, setProductionSteps,
    transactions, setTransactions,
    defects, setDefects,
    repairs, setRepairs,
    companySettings, setCompanySettings,
    error, setError,
    success, setSuccess,
    loading,
    fetchData,
    fetchCompanySettings,
    
    // Editing states
    editingEmployee, setEditingEmployee,
    editingShift, setEditingShift,
    editingClient, setEditingClient,
    editingProduct, setEditingProduct,
    editingProductionOrder, setEditingProductionOrder,
    editingTransaction, setEditingTransaction,
    itemsBreakdown, setItemsBreakdown,
    repairItemsBreakdown, setRepairItemsBreakdown,

    // CRUD Handlers
    saveClient, deleteClient,
    saveProduct, deleteProduct,
    saveProductionOrder, updateProductionOrder, deleteProductionOrder,
    saveProductionStep, deleteProductionStep,
    saveTransaction, updateTransaction, deleteTransaction,
    saveEmployee, deleteEmployee,
    saveShift, updateShift, deleteShift, bulkDeleteShifts,
    saveDefect, deleteDefect,
    saveRepair, deleteRepair,
    updateCompanySettings,
    resetSystem,
    handleLogin,
    handleLogout,
    updateUser,
    advanceOrderStatus,
    launchFinanceFromOrder,
    toggleShiftStatus,
    processBulkPayShifts,

    // Modal states
    modalOpen, setModalOpen,
    selectedOrder, setSelectedOrder,
    selectedTransaction, setSelectedTransaction,
    selectedEmployee, setSelectedEmployee,
    selectedShift, setSelectedShift,
    selectedProduct, setSelectedProduct,
    selectedClient, setSelectedClient,
    confirmModal, setConfirmModal,
    triggerConfirm
  };
}
