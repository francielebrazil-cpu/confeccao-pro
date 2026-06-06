import React, { useState, useEffect, useRef } from 'react';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Legend,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
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
} from './types';
import { Button } from './components/Button';

// --- Components ---

const Logo = ({ size = 40, className = "", src = "/icone.png" }: { size?: number, className?: string, src?: string | null }) => {
  const logoSrc = src && typeof src === 'string' && src.trim() !== "" ? src : "/icone.png";
  
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl ${className}`} style={{ width: size, height: size }}>
      <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, maxWidth?: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden`}
      >
        <div className="px-6 py-4 border-bottom flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Excluir", confirmColor = "bg-red-600" }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, confirmText?: string, confirmColor?: string }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-slate-600">{message}</p>
        <div className="flex justify-end gap-3 pt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 ${confirmColor} text-white rounded-xl transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const statusLabels: Record<string, string> = {
  planning: 'Planejamento',
  cutting: 'Corte',
  sewing: 'Costura',
  finishing: 'Acabamento',
  completed: 'Finalizado'
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

const parseOrderItemGrid = (gridStr: string, sheetsVal: number) => {
  const result: { size: string, quantity: number, multiplier: number }[] = [];
  if (!gridStr || !sheetsVal) return result;
  
  const cleanStr = gridStr.replace(/[,;\/\\+:\-_]/g, ' ');
  const regex = /(\d+)\s*([a-zA-Z0-9]+)/g;
  let match;
  while ((match = regex.exec(cleanStr)) !== null) {
    const mult = parseInt(match[1], 10);
    let size = match[2].trim();
    if (size.toLowerCase().startsWith('x') && size.length > 1 && !isNaN(Number(size.slice(1)))) {
      size = size.slice(1);
    }
    result.push({
      size: size,
      quantity: mult * sheetsVal,
      multiplier: mult
    });
  }
  return result;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'dashboard' | 'shifts' | 'payments' | 'settings' | 'reports' | 'production' | 'partners' | 'finance'>('dashboard');
  const [partnerTab, setPartnerTab] = useState<'clients' | 'employees'>('clients');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  const [formDocType, setFormDocType] = useState<'CPF' | 'CNPJ'>('CNPJ');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('pending');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductionOrderModalOpen, setIsProductionOrderModalOpen] = useState(false);
  const [isProductionOrderDetailModalOpen, setIsProductionOrderDetailModalOpen] = useState(false);
  const [isTransactionDetailModalOpen, setIsTransactionDetailModalOpen] = useState(false);
  const [isRepairDetailModalOpen, setIsRepairDetailModalOpen] = useState(false);
  const [isShiftDetailModalOpen, setIsShiftDetailModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<number | null>(null);
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [selectedEmployeeIdForShifts, setSelectedEmployeeIdForShifts] = useState<number | null>(null);
  const [expandedReportEmployeeId, setExpandedReportEmployeeId] = useState<number | null>(null);
  const [isProductionStepModalOpen, setIsProductionStepModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productionTab, setProductionTab] = useState<'orders' | 'products' | 'repairs'>('orders');
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isBatchFinanceModalOpen, setIsBatchFinanceModalOpen] = useState(false);
  const [financeSearch, setFinanceSearch] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [batchPaymentAmounts, setBatchPaymentAmounts] = useState<Record<number, number>>({});
  const [batchTotalAmount, setBatchTotalAmount] = useState<number | string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isOrderFinanceModalOpen, setIsOrderFinanceModalOpen] = useState(false);
  const [isFractionalModalOpen, setIsFractionalModalOpen] = useState(false);
  const [fractionalOrder, setFractionalOrder] = useState<ProductionOrder | null>(null);
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [pendingFinanceOrder, setPendingFinanceOrder] = useState<ProductionOrder | null>(null);
  const [financeClientSearch, setFinanceClientSearch] = useState('');
  const [showFinanceClientDropdown, setShowFinanceClientDropdown] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [success, setSuccess] = useState('');

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingShift, setEditingShift] = useState<DailyShift | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [orderItemColor, setOrderItemColor] = useState('');
  const [orderItemSize, setOrderItemSize] = useState('');
  const [orderItemQuantity, setOrderItemQuantity] = useState(0);
  const [orderItemSheets, setOrderItemSheets] = useState<number | ''>('');
  const [orderItemGrid, setOrderItemGrid] = useState('');
  const [selectedProductIdForRepair, setSelectedProductIdForRepair] = useState<number | null>(null);
  const [repairItemColor, setRepairItemColor] = useState('');
  const [repairItemSize, setRepairItemSize] = useState('');
  const [repairItemQuantity, setRepairItemQuantity] = useState(0);
  const [selectedProductIdForOrder, setSelectedProductIdForOrder] = useState<number | null>(null);
  const [itemsBreakdown, setItemsBreakdown] = useState<{ color: string, size: string, quantity: number }[]>([]);
  const [repairItemsBreakdown, setRepairItemsBreakdown] = useState<{ color: string, size: string, quantity: number }[]>([]);
  const [editingProductionOrder, setEditingProductionOrder] = useState<ProductionOrder | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [expandedEmployees, setExpandedEmployees] = useState<number[]>([]);
  const [isGroupedView, setIsGroupedView] = useState(true);
  const productionOrderFormRef = useRef<HTMLFormElement>(null);
  const [isDashboardGroupedView, setIsDashboardGroupedView] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [financeTab, setFinanceTab] = useState<'cashflow' | 'payable' | 'receivable' | 'reconciliation' | 'dre' | 'balance' | 'reports'>('cashflow');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'paid' | 'completed'>('all');
  const [reportType, setReportType] = useState<'hours' | 'production' | 'repairs'>('hours');
  const [isGroupedFinanceModalOpen, setIsGroupedFinanceModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void, confirmText?: string, confirmColor?: string } | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmColor?: string) => {
    setConfirmAction({ title, message, onConfirm, confirmText, confirmColor });
    setIsConfirmModalOpen(true);
  };

  // --- Helpers ---
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // dateStr is expected to be YYYY-MM-DD from database
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const isOverdueOrCurrentMonth = (t: FinancialTransaction) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const transDate = new Date(t.dueDate || t.date);
    const transMonth = transDate.getMonth();
    const transYear = transDate.getFullYear();
    
    // Overdue: year is less, or year is same and month is less
    if (transYear < currentYear || (transYear === currentYear && transMonth < currentMonth)) {
      return true;
    }
    
    // Current month: year is same and month is same
    if (transYear === currentYear && transMonth === currentMonth) {
      return true;
    }
    
    return false;
  };

  // --- Auth ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        // Exibe a mensagem específica vinda do servidor
        setError(data.message || data.error || 'Usuário ou senha incorretos');
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      setError('Erro de conexão. Verifique se o servidor está rodando e se o Supabase está configurado corretamente.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('admin');
    setPassword('');
  };

  const updateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const formData = new FormData(e.currentTarget);
    const newUsername = formData.get('newUsername') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: user?.id, 
          username: newUsername, 
          password: newPassword 
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Dados atualizados com sucesso! Por favor, faça login novamente.');
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        setError(data.error || data.message || 'Erro ao atualizar dados');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };

  const addDefect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderId = Number(formData.get('orderId')) || null;
    const type = formData.get('type') as 'entry' | 'exit';
    const quantity = Number(formData.get('quantity'));
    const reason = formData.get('reason') as string;
    const date = formData.get('date') as string;

    if (!quantity || quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }

    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, type, quantity, reason, date })
      });
      const data = await res.json();
      if (data.success) {
        setIsDefectModalOpen(false);
        fetchData();
        setSuccess('Defeito registrado com sucesso!');
      } else {
        setError(data.error || data.message || 'Erro ao lançar defeito');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };

  const deleteDefect = async (id: number) => {
    triggerConfirm(
      "Excluir Lançamento de Defeito",
      "Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.",
      async () => {
        try {
          const res = await fetch(`/api/defects/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchData();
          }
        } catch (err) {
          setError('Erro ao excluir defeito');
        }
      }
    );
  };

  const saveRepair = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pId = Number(formData.get('productId'));
    
    if (!pId) {
      setError('Selecione um produto.');
      return;
    }

    if (repairItemsBreakdown.length === 0) {
      setError('Adicione pelo menos uma cor e tamanho para o concerto.');
      return;
    }

    const data = {
      productId: pId,
      type: formData.get('type') as 'entry' | 'exit',
      date: formData.get('date') as string,
      notes: formData.get('notes') as string,
      items: repairItemsBreakdown
    };

    try {
      const res = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (resData.success) {
        setIsRepairModalOpen(false);
        setRepairItemsBreakdown([]);
        fetchData();
        setSuccess('Concerto registrado com sucesso!');
      } else {
        setError(resData.error || resData.message || 'Erro ao lançar concerto');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };

  const deleteRepair = async (id: number) => {
    triggerConfirm(
      "Excluir Registro de Concerto",
      "Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.",
      async () => {
        try {
          const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            fetchData();
            setSuccess('Concerto excluído com sucesso!');
          } else {
            setError(data.error || data.message || 'Erro ao excluir concerto');
          }
        } catch (err) {
          setError('Erro ao excluir concerto');
        }
      }
    );
  };

  // --- Data Fetching ---
  useEffect(() => {
    if (isProductionOrderModalOpen && productionOrderFormRef.current) {
      const totalFromItems = orderItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const totalFromBreakdown = itemsBreakdown.reduce((acc, curr) => acc + curr.quantity, 0);
      const total = totalFromItems + totalFromBreakdown;
      const form = productionOrderFormRef.current;
      const totalPiecesInput = form.elements.namedItem('totalPieces') as HTMLInputElement;
      const unitPriceInput = form.elements.namedItem('unitPrice') as HTMLInputElement;
      const totalValueInput = form.elements.namedItem('totalValue') as HTMLInputElement;
      
      if (totalPiecesInput) {
        totalPiecesInput.value = String(total);
      }
      
      // Calculate total value as sum of each order item's quantity * unitPrice
      const orderItemsTotalValue = orderItems.reduce((acc, curr) => {
        const price = curr.unitPrice !== undefined ? curr.unitPrice : 0;
        return acc + (curr.quantity * price);
      }, 0);

      // Also include any pending breakdown currently being entered
      const pendingProduct = products.find(p => p.id === selectedProductIdForOrder);
      const pendingUnitPrice = pendingProduct?.productionValue || (unitPriceInput ? Number(unitPriceInput.value) : 0) || 0;
      const pendingTotalValue = totalFromBreakdown * pendingUnitPrice;

      const grandTotalValue = orderItemsTotalValue + pendingTotalValue;

      if (totalValueInput) {
        totalValueInput.value = grandTotalValue.toFixed(2);
      }
      if (unitPriceInput) {
        unitPriceInput.value = (grandTotalValue / (total || 1)).toFixed(2);
      }
    }
  }, [itemsBreakdown, orderItems, isProductionOrderModalOpen, selectedProductIdForOrder, products]);

  const addPDFHeader = (doc: jsPDF, title: string) => {
    // Background color if set
    if (companySettings.pdf_background_color) {
      const color = companySettings.pdf_background_color.replace('#', '');
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        doc.setFillColor(r, g, b);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
      }
    }

    // Logo colors from the new brand
    const pink = [255, 0, 128]; // #ff0080
    const purple = [123, 44, 191]; // #7b2cbf
    const darkPurple = [60, 9, 108]; // #3c096c

    const logoToUse = companySettings.logo_url || "/icone.png";

    if (logoToUse) {
      try {
        // Move logo down to 15 to avoid overlap with border at 10
        doc.addImage(logoToUse, 'PNG', 14, 15, 20, 20);
      } catch (e) {
        console.error("Error adding logo to PDF:", e);
        // Fallback to default logo if image fails
        drawDefaultLogo(doc, pink, darkPurple);
      }
    } else {
      drawDefaultLogo(doc, pink, darkPurple);
    }

    // App Name
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name || 'Confecção Pro', 35, 25);

    // Report Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(title, 35, 33);

    // Horizontal Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    return 52; // New content start Y
  };

  const drawDefaultLogo = (doc: jsPDF, pink: number[], purple: number[]) => {
    // Sewing Machine Body (Outline)
    doc.setDrawColor(pink[0], pink[1], pink[2]);
    doc.setLineWidth(0.8);
    
    // Main body
    doc.line(18, 16, 28, 16); // Top
    doc.line(28, 16, 28, 24); // Right
    doc.line(28, 24, 22, 24); // Bottom inner
    doc.line(22, 24, 22, 20); // Left inner
    doc.line(22, 20, 18, 20); // Needle area
    doc.line(18, 20, 18, 16); // Left

    // Spool
    doc.setFillColor(pink[0], pink[1], pink[2]);
    doc.rect(24, 13, 3, 3, 'F');
    doc.line(25.5, 13, 25.5, 11);

    // Fabric (Solid with purple)
    doc.setFillColor(purple[0], purple[1], purple[2]);
    doc.setDrawColor(purple[0], purple[1], purple[2]);
    doc.ellipse(20, 24, 4, 2, 'F');
    
    // Stitching on fabric
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.line(18, 24, 22, 24);
  };

  const exportProductionOrderReportPDF = (orders: ProductionOrder[], type: 'detailed' | 'grouped') => {
    const doc = new jsPDF();
    const title = type === 'detailed' ? 'Relatório Detalhado de Ordens de Produção' : 'Relatório Agrupado de Ordens de Produção';
    
    const startY = addPDFHeader(doc, title);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, startY - 5);
    doc.text(`Período: ${formatDate(startDate)} até ${formatDate(endDate)}`, 14, startY + 2);

    if (type === 'detailed') {
      const tableData = orders.map(o => [
        o.orderNumber ? `#${o.orderNumber}` : o.id,
        o.description,
        o.clientName || '-',
        o.items?.map(i => i.productName).join(', ') || '-',
        o.totalPieces,
        (o.items || []).flatMap(i => (i.itemsBreakdown || []).map(b => `${i.productName} - ${b.color}/${b.size}: ${b.quantity}`)).join('\n'),
        `R$ ${o.totalValue?.toFixed(2) || '0.00'}`,
        o.status === 'completed' ? 'Finalizado' : 'Pendente',
        formatDate(o.startDate)
      ]);

      autoTable(doc, {
        startY: startY + 10,
        head: [['Nº Ordem', 'Descrição', 'Cliente', 'Produto', 'Peças', 'Grade (Cor/Tam: Qtd)', 'Valor', 'Status', 'Início']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },
          5: { cellWidth: 40 } // Grade column
        }
      });
    } else {
      // Grouped by Status
      const grouped = orders.reduce((acc, curr) => {
        const status = curr.status;
        if (!acc[status]) acc[status] = { count: 0, pieces: 0, value: 0 };
        acc[status].count += 1;
        acc[status].pieces += curr.totalPieces;
        acc[status].value += curr.totalValue || 0;
        return acc;
      }, {} as Record<string, { count: number, pieces: number, value: number }>);

      const tableData = Object.entries(grouped).map(([status, data]) => [
        status,
        data.count,
        data.pieces,
        `R$ ${data.value.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: startY + 10,
        head: [['Status', 'Qtd. Ordens', 'Total Peças', 'Valor Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });
    }

    doc.save(`relatorio-producao-${type}-${new Date().getTime()}.pdf`);
  };

  const exportRepairReportPDF = (repairsList: Repair[]) => {
    const doc = new jsPDF();
    const startY = addPDFHeader(doc, 'Relatório de Concertos (Entrada e Saída)');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, startY - 5);
    doc.text(`Período: ${formatDate(startDate)} até ${formatDate(endDate)}`, 14, startY + 2);

    const tableData = repairsList.map(r => [
      formatDate(r.date),
      r.productName || '-',
      `${r.color} / ${r.size}`,
      r.type === 'entry' ? 'Entrada' : 'Saída',
      r.quantity,
      r.notes || '-'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Produto', 'Cor/Tam', 'Tipo', 'Qtd', 'Observações']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    // Summary
    const totalEntry = repairsList.filter(r => r.type === 'entry').reduce((acc, curr) => acc + curr.quantity, 0);
    const totalExit = repairsList.filter(r => r.type === 'exit').reduce((acc, curr) => acc + curr.quantity, 0);
    const balance = totalEntry - totalExit;

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total de Entradas: ${totalEntry}`, 14, finalY);
    doc.text(`Total de Saídas: ${totalExit}`, 14, finalY + 7);
    doc.text(`Saldo de Concertos Pendentes: ${balance}`, 14, finalY + 14);

    doc.save(`relatorio-concertos-${new Date().getTime()}.pdf`);
  };

  const exportIndividualProductionOrderPDF = (order: ProductionOrder) => {
    const doc = new jsPDF();
    const stats = getOrderStats(order.id);
    const steps = productionSteps.filter(s => s.orderId === order.id);
    const orderTransactions = transactions.filter(t => t.relatedId === order.id && t.category === 'Venda de Produção');

    const startY = addPDFHeader(doc, `Ordem de Produção #${order.orderNumber || order.id}`);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, startY - 5);

    // Header Info
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Informações Gerais', 14, startY + 5);
    
    const generalInfo = [
      ['Descrição:', order.description],
      ['Cliente:', clients.find(c => c.id === order.clientId)?.name || '-'],
      ['Produtos:', order.items?.map(i => i.productName).join(', ') || '-'],
      ['Status:', order.status === 'completed' ? 'Finalizado' : 
                order.status === 'planning' ? 'Planejamento' :
                order.status === 'cutting' ? 'Corte' :
                order.status === 'sewing' ? 'Costura' : 'Acabamento'],
      ['Data de Início:', formatDate(order.startDate)],
      ['Data de Fim:', order.endDate ? formatDate(order.endDate) : '-'],
      ['Total de Peças:', order.totalPieces.toString()]
    ];

    autoTable(doc, {
      startY: startY + 10,
      body: generalInfo,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // Grade de Peças
    if (order.items && order.items.length > 0) {
      doc.setFontSize(12);
      doc.text('Grade de Peças (Produtos, Cores e Tamanhos)', 14, currentY);
      
      const breakdownData = order.items.flatMap(item => 
        item.itemsBreakdown.map(b => [
          item.productName,
          b.color,
          b.size,
          b.quantity
        ])
      );

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Produto', 'Cor', 'Tamanho', 'Quantidade']],
        body: breakdownData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Financeiro
    if (orderTransactions.length > 0) {
      doc.setFontSize(12);
      doc.text('Informações Financeiras', 14, currentY);
      
      const financeData = orderTransactions.map(t => [
        formatDate(t.date),
        t.description,
        `R$ ${t.amount.toFixed(2)}`,
        t.status === 'completed' ? 'Recebido' : 'Pendente'
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Data', 'Descrição', 'Valor', 'Status']],
        body: financeData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald
        styles: { fontSize: 9 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Histórico de Produção (Etapas)
    if (steps.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Histórico de Etapas de Produção', 14, currentY);
      
      const stepsData = steps.map(s => [
        formatDate(s.date),
        s.employeeName || employees.find(e => e.id === s.employeeId)?.name || '-',
        statusLabels[s.stepType] || s.stepType,
        s.quantity
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Data', 'Funcionário', 'Etapa', 'Quantidade']],
        body: stepsData,
        theme: 'striped',
        headStyles: { fillColor: [123, 44, 191] }, // Purple
        styles: { fontSize: 9 }
      });
    }

    doc.save(`ordem-producao-${order.orderNumber || order.id}-${new Date().getTime()}.pdf`);
  };

  const generateFinancialTransactionReport = (transaction: FinancialTransaction) => {
    const doc = new jsPDF();
    const title = transaction.type === 'expense' ? 'Comprovante de Conta a Pagar' : 'Comprovante de Conta a Receber';
    
    const startY = addPDFHeader(doc, title);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, startY - 5);

    const displayClientName = transaction.clientName || (
      transaction.relatedId && transaction.category === 'Venda de Produção' 
        ? productionOrders.find(o => o.id === transaction.relatedId)?.clientName 
        : null
    ) || '-';

    const tableData = [
      ['Descrição', transaction.description],
      ['cliente/funcionário', displayClientName],
      ['Categoria', transaction.category],
      ['Data', formatDate(transaction.date)],
      ['Valor Total', `R$ ${transaction.amount.toFixed(2)}`],
      ['Valor Pago', `R$ ${(transaction.paidAmount || 0).toFixed(2)}`],
      ['Saldo Devedor', `R$ ${(transaction.amount - (transaction.paidAmount || 0)).toFixed(2)}`],
      ['Status', transaction.status === 'completed' ? 'Efetivado' : transaction.status === 'partial' ? 'Parcial' : 'Pendente'],
      ['Conciliado', transaction.reconciled ? 'Sim' : 'Não']
    ];

    autoTable(doc, {
      startY: startY + 10,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] },
        1: { cellWidth: 130 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(60, finalY, 150, finalY);
    doc.setFontSize(8);
    doc.text('Assinatura / Responsável', 105, finalY + 5, { align: 'center' });

    doc.save(`comprovante-${transaction.id}-${new Date().getTime()}.pdf`);
  };

  const generateFinanceListReport = (type: 'income' | 'expense') => {
    const doc = new jsPDF();
    const title = type === 'expense' ? 'Relatório de Contas a Pagar' : 'Relatório de Contas a Receber';
    const filteredTransactions = transactions.filter(t => t.type === type);
    
    const startY = addPDFHeader(doc, title);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, startY - 5);

    const tableData = filteredTransactions.map(t => {
      const displayClientName = t.clientName || (
        t.relatedId && t.category === 'Venda de Produção' 
          ? productionOrders.find(o => o.id === t.relatedId)?.clientName 
          : null
      ) || '-';

      return [
        t.description,
        displayClientName,
        t.category,
        formatDate(t.date),
        `R$ ${t.amount.toFixed(2)}`,
        `R$ ${(t.paidAmount || 0).toFixed(2)}`,
        t.status === 'completed' ? 'Efetivado' : t.status === 'partial' ? 'Parcial' : 'Pendente'
      ];
    });

    autoTable(doc, {
      startY: startY + 10,
      head: [['Descrição', 'Cliente/Fornecedor', 'Categoria', 'Data', 'Total', 'Pago', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalPaid = filteredTransactions.reduce((acc, t) => acc + (t.paidAmount || 0), 0);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Geral: R$ ${totalAmount.toFixed(2)}`, 196, finalY, { align: 'right' });
    doc.text(`Total Pago: R$ ${totalPaid.toFixed(2)}`, 196, finalY + 7, { align: 'right' });
    doc.text(`Saldo a ${type === 'expense' ? 'Pagar' : 'Receber'}: R$ ${(totalAmount - totalPaid).toFixed(2)}`, 196, finalY + 14, { align: 'right' });

    doc.save(`relatorio-financeiro-${type}-${new Date().getTime()}.pdf`);
  };

  const generateBatchFinanceReport = () => {
    const doc = new jsPDF();
    const title = financeTab === 'payable' ? 'Relatório de Pagamento em Lote' : 'Relatório de Recebimento em Lote';
    const startY = addPDFHeader(doc, title);

    const selectedTrans = transactions
      .filter(t => selectedTransactions.includes(t.id))
      .sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date));
    
    let totalBalanceBefore = 0;
    let totalPaying = 0;
    let totalRemaining = 0;

    const tableData = selectedTrans.map(t => {
      const balanceBefore = t.amount - (t.paidAmount || 0);
      const paying = batchPaymentAmounts[t.id] || 0;
      const remaining = balanceBefore - paying;

      totalBalanceBefore += balanceBefore;
      totalPaying += paying;
      totalRemaining += remaining;

      return [
        formatDate(t.dueDate || t.date),
        t.description,
        `R$ ${balanceBefore.toFixed(2)}`,
        `R$ ${paying.toFixed(2)}`,
        `R$ ${remaining.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: startY + 10,
      head: [['Data', 'Descrição', 'Saldo Anterior', 'Valor Lançado', 'Saldo Restante']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: financeTab === 'payable' ? [239, 68, 68] : [16, 185, 129] },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Lote', 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total das Contas: R$ ${totalBalanceBefore.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Total a ${financeTab === 'payable' ? 'Pagar' : 'Receber'}: R$ ${totalPaying.toFixed(2)}`, 14, finalY + 14);
    doc.text(`Total Restante: R$ ${totalRemaining.toFixed(2)}`, 14, finalY + 21);

    doc.save(`relatorio-lote-${financeTab}-${new Date().getTime()}.pdf`);
  };

  const distributeBatchAmount = (total: number) => {
    let remaining = total;
    const newAmounts: Record<number, number> = {};
    
    // Get selected transactions in order (oldest first)
    const selectedTrans = transactions
      .filter(t => selectedTransactions.includes(t.id))
      .sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date));
    
    selectedTrans.forEach(t => {
      const balance = t.amount - (t.paidAmount || 0);
      if (remaining > 0) {
        const paying = Math.min(remaining, balance);
        newAmounts[t.id] = parseFloat(paying.toFixed(2));
        remaining -= paying;
      } else {
        newAmounts[t.id] = 0;
      }
    });
    
    setBatchPaymentAmounts(newAmounts);
  };

  const exportBulkIndividualProductionOrderPDF = (orders: ProductionOrder[]) => {
    if (!orders || orders.length === 0) return;
    const doc = new jsPDF();
    
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      
      const stats = getOrderStats(order.id);
      const steps = productionSteps.filter(s => s.orderId === order.id);
      const orderTransactions = transactions.filter(t => t.relatedId === order.id && t.category === 'Venda de Produção');

      const startY = addPDFHeader(doc, `Ficha de Ordem de Produção #${order.orderNumber || order.id}`);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, startY - 5);

      // Header Info
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Informações Gerais', 14, startY + 5);
      
      const generalInfo = [
        ['Descrição:', order.description],
        ['Cliente:', clients.find(c => c.id === order.clientId)?.name || '-'],
        ['Produtos:', order.items?.map(i => i.productName).join(', ') || '-'],
        ['Status:', order.status === 'completed' ? 'Finalizado' : 
                  order.status === 'planning' ? 'Planejamento' :
                  order.status === 'cutting' ? 'Corte' :
                  order.status === 'sewing' ? 'Costura' : 'Acabamento'],
        ['Data de Início:', formatDate(order.startDate)],
        ['Data de Fim:', order.endDate ? formatDate(order.endDate) : '-'],
        ['Total de Peças:', order.totalPieces.toString()]
      ];

      autoTable(doc, {
        startY: startY + 10,
        body: generalInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 10;

      // Grade de Peças
      if (order.items && order.items.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Grade de Peças', 14, currentY);
        
        const breakdownData = order.items.flatMap(item => 
          item.itemsBreakdown.map(b => [
            item.productName,
            b.color,
            b.size,
            b.quantity
          ])
        );

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Produto', 'Cor', 'Tamanho', 'Quantidade']],
          body: breakdownData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Histórico de Produção (Etapas)
      if (steps.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Histórico de Etapas de Produção', 14, currentY);
        
        const stepsData = steps.map(s => [
          formatDate(s.date),
          s.employeeName || employees.find(e => e.id === s.employeeId)?.name || '-',
          statusLabels[s.stepType] || s.stepType,
          s.quantity
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Data', 'Funcionário', 'Etapa', 'Quantidade']],
          body: stepsData,
          theme: 'striped',
          headStyles: { fillColor: [123, 44, 191] }, // Purple
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Informações Financeiras
      if (orderTransactions.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Informações Financeiras Associadas', 14, currentY);
        
        const financeData = orderTransactions.map(t => [
          formatDate(t.date),
          t.description,
          `R$ ${t.amount.toFixed(2)}`,
          t.status === 'completed' ? 'Recebido' : 'Pendente'
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Data', 'Descrição', 'Valor', 'Status']],
          body: financeData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] }, // Emerald
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    });

    doc.save(`fichas-individuais-producao-${new Date().getTime()}.pdf`);
  };

  const fetchCompanySettings = async () => {
    try {
      const res = await fetch('/api/company-settings');
      const data = await res.json();
      if (data && !data.error) {
        setCompanySettings(data);
        setFormDocType(data.document_type || 'CNPJ');
      }
    } catch (err) {
      console.error('Error fetching company settings:', err);
    }
  };

  const fetchData = async () => {
    if (!user) return;
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
      if (empData.error) {
        setError(empData.error);
        return;
      }

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
      if (Array.isArray(orderData)) {
        const sortedOrders = [...orderData].sort((a, b) => {
          const numA = a.orderNumber ? parseInt(a.orderNumber.replace(/\D/g, '')) : a.id;
          const numB = b.orderNumber ? parseInt(b.orderNumber.replace(/\D/g, '')) : b.id;
          return numB - numA;
        });
        setProductionOrders(sortedOrders);
      }
      if (Array.isArray(stepData)) setProductionSteps(stepData);
      if (Array.isArray(financeData)) setTransactions(financeData);
      if (Array.isArray(defectData)) setDefects(defectData);
      if (Array.isArray(repairData)) setRepairs(repairData);
      
      // Also fetch company settings to keep it updated
      fetchCompanySettings();

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) {
          console.warn('API Health check failed with status:', res.status);
        } else {
          // API health check passed silently
        }
      } catch (err) {
        console.error('API Health check failed (connection error):', err);
      }
    };
    checkHealth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (isFinanceModalOpen && editingTransaction) {
      setFinanceClientSearch(editingTransaction.clientName || '');
      setIsRecurring(!!editingTransaction.isRecurring);
    } else if (!isFinanceModalOpen) {
      setFinanceClientSearch('');
      setShowFinanceClientDropdown(false);
      setIsRecurring(false);
    }
  }, [isFinanceModalOpen, editingTransaction]);

  const filteredFinanceClients = [
    ...clients.map(c => ({ id: c.id, name: c.name, type: 'Cliente' })),
    ...employees.map(e => ({ id: e.id, name: e.name, type: 'Funcionário' }))
  ].filter(item => 
    item.name.toLowerCase().includes(financeClientSearch.toLowerCase())
  );

  // --- CRUD Handlers ---
  const saveClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    // Duplicate check
    const isDuplicate = clients.some(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      (!editingClient || c.id !== editingClient.id)
    );

    if (isDuplicate) {
      setError('Já existe um cliente com este nome.');
      return;
    }

    const data = {
      name,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };
    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      setIsClientModalOpen(false);
      setEditingClient(null);
      await fetchData();
      setSuccess('Cliente salvo com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar cliente');
    }
  };

  const deleteClient = async (id: number) => {
    triggerConfirm('Excluir Cliente', 'Deseja realmente excluir este cliente?', async () => {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchData();
      setSuccess('Cliente excluído com sucesso!');
    });
  };

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;

    // Duplicate check
    const isDuplicate = products.some(p => 
      (p.name.toLowerCase() === name.toLowerCase() || (sku && p.sku && p.sku.toLowerCase() === sku.toLowerCase())) && 
      (!editingProduct || p.id !== editingProduct.id)
    );

    if (isDuplicate) {
      setError('Já existe um produto com este nome ou SKU.');
      return;
    }

    const data = {
      name,
      sku,
      category: formData.get('category') as string,
      technicalSheet: formData.get('technicalSheet') as string,
      photos: editingProduct?.photos || [],
      colors: editingProduct?.colors || [],
      sizes: editingProduct?.sizes || [],
      productionValue: Number(formData.get('productionValue')) || 0,
    };
    const url = editingProduct && editingProduct.id !== 0 ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct && editingProduct.id !== 0 ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await fetchData();
      setSuccess('Produto salvo com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar produto');
    }
  };

  const deleteProduct = async (product: Product) => {
    triggerConfirm('Excluir Produto', `Deseja realmente excluir o produto "${product.name}"?`, async () => {
      try {
        const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchData();
          setSuccess('Produto excluído com sucesso!');
        } else {
          const data = await response.json();
          setError(data.error || 'Erro ao excluir produto');
        }
      } catch (err) {
        setError('Erro de conexão ao excluir produto');
      }
    });
  };

  const updateAutoDescription = () => {
    if (!productionOrderFormRef.current) return;
    const form = productionOrderFormRef.current;
    const status = (form.elements.namedItem('status') as HTMLSelectElement).value;
    const descriptionInput = form.elements.namedItem('description') as HTMLInputElement;
    
    if (orderItems.length > 0 && descriptionInput) {
      const statusLabel = statusLabels[status] || status;
      const productNames = orderItems.map(item => item.productName).filter(Boolean).join(', ');
      descriptionInput.value = `${productNames} - ${statusLabel}`;
    }
  };

  const saveProductionOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const description = formData.get('description') as string;

    let finalOrderItems = [...orderItems];
    
    // Se houver uma grade pendente que ainda não foi adicionada aos itens da ordem
    if (selectedProductIdForOrder && itemsBreakdown.length > 0) {
      const product = products.find(p => p.id === selectedProductIdForOrder);
      if (product) {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: itemsBreakdown.reduce((acc, i) => acc + i.quantity, 0),
          itemsBreakdown: [...itemsBreakdown],
          unitPrice: product.productionValue || 0
        };
        finalOrderItems.push(newItem);
        // Limpa os estados pendentes
        setItemsBreakdown([]);
        setSelectedProductIdForOrder(null);
      }
    }

    if (finalOrderItems.length === 0) {
      setError('Adicione pelo menos um produto com grade à ordem de produção.');
      return;
    }

    const data = {
      description,
      clientId: Number(formData.get('clientId')) || null,
      items: finalOrderItems,
      totalPieces: finalOrderItems.reduce((acc, item) => acc + item.quantity, 0),
      unitPrice: Number(formData.get('unitPrice')) || 0,
      totalValue: Number(formData.get('totalValue')) || 0,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || null,
    };
    const url = editingProductionOrder ? `/api/production-orders/${editingProductionOrder.id}` : '/api/production-orders';
    const method = editingProductionOrder ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      const savedOrder = await response.json();
      setIsProductionOrderModalOpen(false);
      
      // Check if status is completed to offer financial launch
      if (data.status === 'completed' && (!editingProductionOrder || editingProductionOrder.status !== 'completed')) {
        setPendingFinanceOrder({ ...data, id: editingProductionOrder?.id || savedOrder.id } as ProductionOrder);
        setIsOrderFinanceModalOpen(true);
      }
      
      setEditingProductionOrder(null);
      await fetchData();
      setSuccess('Ordem de produção salva com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar ordem de produção');
    }
  };

  const toggleProductionStatus = async (order: ProductionOrder) => {
    const nextStatus = order.status === 'completed' ? 'planning' : 'completed';
    const nextStatusLabel = statusLabels[nextStatus];
    const productNames = order.items?.map(i => i.productName).join(', ');
    const newDescription = productNames ? `${productNames} - ${nextStatusLabel}` : nextStatusLabel;

    try {
      const response = await fetch(`/api/production-orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...order,
          status: nextStatus,
          description: newDescription,
          endDate: nextStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : null
        })
      });
      if (response.ok) {
        await fetchData();
        setSuccess(`Ordem "${newDescription}" marcada como ${nextStatus === 'completed' ? 'Finalizada' : 'Pendente'}.`);
        if (nextStatus === 'completed') {
          setPendingFinanceOrder({ ...order, status: 'completed', description: newDescription } as ProductionOrder);
          setIsOrderFinanceModalOpen(true);
        }
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };

  const advanceOrderStatus = async (order: ProductionOrder) => {
    const statusFlow: ProductionOrder['status'][] = ['planning', 'cutting', 'sewing', 'finishing', 'completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      
      if (nextStatus === 'completed') {
        setFractionalOrder(order);
        setCompletedQuantity(order.totalPieces);
        setIsFractionalModalOpen(true);
        return;
      }
      
      const nextStatusLabel = statusLabels[nextStatus];
      const productNames = order.items?.map(i => i.productName).join(', ');
      const newDescription = productNames ? `${productNames} - ${nextStatusLabel}` : nextStatusLabel;
      
      try {
        const response = await fetch(`/api/production-orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...order,
            status: nextStatus,
            description: newDescription,
            endDate: order.endDate
          })
        });
        
        if (response.ok) {
          await fetchData();
          setSuccess(`Status da ordem "${newDescription}" avançado para ${nextStatusLabel}.`);
        } else {
          setError('Erro ao avançar status da ordem');
        }
      } catch (err) {
        setError('Erro de conexão ao avançar status');
      }
    }
  };

  const completeFractionalOrder = async () => {
    if (!fractionalOrder) return;
    
    const quantity = Number(completedQuantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > fractionalOrder.totalPieces) {
      setError('Quantidade inválida');
      return;
    }

    const remaining = fractionalOrder.totalPieces - quantity;
    const nextStatus = 'completed';
    const nextStatusLabel = statusLabels[nextStatus];
    const newDescription = fractionalOrder.productName ? `${fractionalOrder.productName} - ${nextStatusLabel}` : nextStatusLabel;

    try {
      // 1. Update current order to completed with the specified quantity
      const response = await fetch(`/api/production-orders/${fractionalOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fractionalOrder,
          totalPieces: quantity,
          status: nextStatus,
          description: newDescription,
          endDate: new Date().toLocaleDateString('en-CA'),
          totalValue: (fractionalOrder.unitPrice || 0) * quantity
        })
      });

      if (response.ok) {
        // 2. If there's a remainder, create a new order
        if (remaining > 0) {
          const newOrderData = {
            ...fractionalOrder,
            id: undefined,
            totalPieces: remaining,
            status: 'planning',
            description: `${fractionalOrder.description} (Restante)`,
            startDate: new Date().toLocaleDateString('en-CA'),
            endDate: null,
            totalValue: (fractionalOrder.unitPrice || 0) * remaining,
            orderNumber: fractionalOrder.orderNumber ? `${fractionalOrder.orderNumber}-R` : undefined
          };
          
          await fetch('/api/production-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrderData)
          });
        }

        await fetchData();
        setSuccess(`Ordem finalizada com ${quantity} peças. ${remaining > 0 ? `Nova ordem criada com ${remaining} peças.` : ''}`);
        setIsFractionalModalOpen(false);
        setFractionalOrder(null);
        
        // Open finance modal for the completed part
        setPendingFinanceOrder({ 
          ...fractionalOrder, 
          id: fractionalOrder.id,
          totalPieces: quantity, 
          status: 'completed', 
          description: newDescription,
          totalValue: (fractionalOrder.unitPrice || 0) * quantity
        } as ProductionOrder);
        setIsOrderFinanceModalOpen(true);
      } else {
        setError('Erro ao finalizar ordem');
      }
    } catch (err) {
      setError('Erro de conexão ao finalizar ordem');
    }
  };

  const launchFinanceFromOrder = async (status: 'pending' | 'completed') => {
    if (!pendingFinanceOrder) return;
    
    const amount = Number(pendingFinanceOrder.totalValue || 0);
    const orderRef = pendingFinanceOrder.orderNumber ? `#${pendingFinanceOrder.orderNumber}` : `ID:${pendingFinanceOrder.id}`;
    
    const transactionData = {
      type: 'income',
      category: 'Venda de Produção',
      amount: amount,
      paidAmount: status === 'completed' ? amount : 0,
      date: new Date().toLocaleDateString('en-CA'),
      description: `Recebimento Ordem ${orderRef}: ${pendingFinanceOrder.description}`,
      relatedId: pendingFinanceOrder.id,
      clientName: pendingFinanceOrder.clientName,
      status: status,
      dueDate: status === 'pending' ? new Date().toLocaleDateString('en-CA') : null,
      finishedDate: status === 'completed' ? new Date().toLocaleDateString('en-CA') : null,
      reconciled: status === 'completed'
    };

    const response = await fetch('/api/financial-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });

    if (response.ok) {
      setSuccess(`Financeiro lançado como ${status === 'completed' ? 'Pago' : 'Pendente'}!`);
      setIsOrderFinanceModalOpen(false);
      setPendingFinanceOrder(null);
      await fetchData();
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'Erro ao lançar financeiro da ordem');
    }
  };

  const deleteProductionOrder = async (id: number) => {
    triggerConfirm('Excluir Ordem de Produção', 'Deseja excluir esta ordem de produção? Todas as etapas relacionadas também serão excluídas.', async () => {
      const response = await fetch(`/api/production-orders/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        setSuccess('Ordem de produção excluída!');
      }
    });
  };

  const saveProductionStep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      orderId: Number(formData.get('orderId')),
      employeeId: Number(formData.get('employeeId')),
      stepType: formData.get('stepType') as string,
      quantity: Number(formData.get('quantity')),
      date: formData.get('date') as string,
    };
    const response = await fetch('/api/production-steps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      setIsProductionStepModalOpen(false);
      await fetchData();
      setSuccess('Produção lançada com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar etapa de produção');
    }
  };

  const deleteProductionStep = async (id: number) => {
    triggerConfirm('Excluir Lançamento', 'Deseja excluir este lançamento de produção?', async () => {
      const response = await fetch(`/api/production-steps/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        setSuccess('Lançamento excluído!');
      }
    });
  };

  const saveTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amountStr = (formData.get('amount') as string).replace(',', '.');
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
      setError('Valor inválido. Use números (ex: 10.50 ou 10,50)');
      return;
    }

    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const type = formData.get('type') as string;

    // Duplicate check: same description, amount, date and type
    const isDuplicate = transactions.some(t => 
      t.description.toLowerCase() === description.toLowerCase() && 
      t.amount === amount && 
      t.date === date && 
      t.type === type &&
      (!editingTransaction || t.id !== editingTransaction.id)
    );

    if (isDuplicate) {
      setError('Já existe uma transação idêntica (mesma descrição, valor, data e tipo) registrada.');
      return;
    }

    const status = formData.get('status') as 'pending' | 'partial' | 'completed';
    const isRecurringCheck = formData.get('isRecurring') === 'true';
    const recurrencePeriod = formData.get('recurrencePeriod') as 'monthly' | 'weekly' | 'daily';
    const recurrenceCount = Number(formData.get('recurrenceCount') || 1);

    const baseData = {
      type,
      category: formData.get('category') as string,
      amount: amount,
      paidAmount: editingTransaction ? editingTransaction.paidAmount : (status === 'completed' ? amount : 0),
      date,
      description,
      clientName: formData.get('clientName') as string || null,
      relatedId: formData.get('relatedId') ? Number(formData.get('relatedId')) : null,
      status,
      dueDate: formData.get('dueDate') as string || null,
      finishedDate: status === 'completed' ? (editingTransaction?.finishedDate || new Date().toLocaleDateString('en-CA')) : null,
      reconciled: formData.get('reconciled') === 'true',
      isRecurring: isRecurringCheck,
      recurrencePeriod: isRecurringCheck ? recurrencePeriod : null,
      recurrenceCount: isRecurringCheck ? recurrenceCount : null
    };

    if (!editingTransaction && isRecurringCheck && recurrenceCount > 1) {
      // Create multiple transactions
      const promises = [];
      for (let i = 0; i < recurrenceCount; i++) {
        const nextDate = (dateStr: string, period: string, index: number) => {
          const d = new Date(dateStr + 'T12:00:00');
          if (period === 'monthly') d.setMonth(d.getMonth() + index);
          else if (period === 'weekly') d.setDate(d.getDate() + (index * 7));
          else if (period === 'daily') d.setDate(d.getDate() + index);
          return d.toISOString().split('T')[0];
        };

        const currentDueDate = baseData.dueDate ? nextDate(baseData.dueDate, recurrencePeriod, i) : null;
        const currentDate = nextDate(baseData.date, recurrencePeriod, i);
        
        const installmentData = {
          ...baseData,
          date: currentDate,
          dueDate: currentDueDate,
          description: `${description} (${i + 1}/${recurrenceCount})`,
          // Only the first one can be completed if set that way, or all? 
          // Usually fixed expenses are created as pending for future months.
          status: i === 0 ? status : 'pending',
          paidAmount: i === 0 ? baseData.paidAmount : 0,
          finishedDate: i === 0 ? baseData.finishedDate : null,
          reconciled: i === 0 ? baseData.reconciled : false
        };

        promises.push(fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(installmentData)
        }));
      }

      const results = await Promise.all(promises);
      if (results.every(r => r.ok)) {
        setIsFinanceModalOpen(false);
        await fetchData();
        setSuccess(`${recurrenceCount} transações geradas com sucesso!`);
      } else {
        setError('Erro ao gerar algumas transações recorrentes');
      }
      return;
    }

    const url = editingTransaction ? `/api/financial-transactions/${editingTransaction.id}` : '/api/financial-transactions';
    const method = editingTransaction ? 'PUT' : 'POST';

    const response = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(baseData) 
    });

    if (response.ok) {
      setIsFinanceModalOpen(false);
      setEditingTransaction(null);
      await fetchData();
      setSuccess('Transação salva com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar transação');
    }
  };

  const updateTransactionStatus = async (transaction: FinancialTransaction, newStatus: 'pending' | 'partial' | 'completed', paymentAmount?: number) => {
    const updatedPaidAmount = (transaction.paidAmount || 0) + (paymentAmount || 0);
    const finalStatus = paymentAmount ? (updatedPaidAmount >= transaction.amount ? 'completed' : 'partial') : newStatus;
    
    const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...transaction, 
        status: finalStatus,
        finishedDate: finalStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : transaction.finishedDate,
        paidAmount: paymentAmount ? updatedPaidAmount : (newStatus === 'completed' ? transaction.amount : transaction.paidAmount)
      })
    });
    if (response.ok) {
      await fetchData();
    }
  };

  const toggleReconciliation = async (transaction: FinancialTransaction) => {
    const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...transaction, reconciled: !transaction.reconciled })
    });
    if (response.ok) {
      await fetchData();
    }
  };

  const deleteTransaction = async (id: number) => {
    triggerConfirm('Excluir Transação', 'Deseja realmente excluir esta transação?', async () => {
      const response = await fetch(`/api/financial-transactions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        setSuccess('Transação excluída!');
      }
    });
  };

  const reverseTransaction = async (transaction: FinancialTransaction) => {
    triggerConfirm(
      'Estornar Transação', 
      'Deseja realmente estornar este pagamento/recebimento? O valor pago será zerado e a conta voltará para pendente.', 
      async () => {
        const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...transaction, 
            status: 'pending',
            paidAmount: 0
          })
        });
        if (response.ok) {
          await fetchData();
          setSuccess('Transação estornada com sucesso!');
        }
      },
      'Estornar',
      'bg-emerald-600'
    );
  };

  const saveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const dailyRate = Number(formData.get('dailyRate'));
    const cpf = formData.get('cpf') as string;
    const address = formData.get('address') as string;
    const pix_key = formData.get('pix_key') as string;

    // Duplicate check
    const isDuplicate = employees.some(emp => 
      emp.name.toLowerCase() === name.toLowerCase() && 
      (!editingEmployee || emp.id !== editingEmployee.id)
    );

    if (isDuplicate) {
      setError('Já existe um funcionário com este nome.');
      return;
    }

    const employeeData = {
      name,
      role,
      dailyRate,
      cpf,
      address,
      pix_key
    };

    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });

    if (response.ok) {
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
      await fetchData();
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar funcionário');
    }
  };

  const deleteEmployee = async (id: number) => {
    triggerConfirm('Excluir Funcionário', 'Deseja realmente excluir este funcionário?', async () => {
      try {
        const res = await fetch(`/api/employees/${id}`, { 
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao excluir funcionário do servidor');
        }
        
        await fetchData();
        setSuccess('Funcionário excluído!');
      } catch (err) {
        setError('Não foi possível excluir o funcionário: ' + (err as Error).message);
      }
    });
  };

  const saveShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employeeId = Number(formData.get('employeeId'));
    const date = formData.get('date') as string;

    // Duplicate check: same employee, same date
    const isDuplicate = shifts.some(s => 
      s.employeeId === employeeId && 
      s.date === date && 
      (!editingShift || s.id !== editingShift.id)
    );

    if (isDuplicate) {
      setError('Este funcionário já possui uma diária registrada para esta data.');
      return;
    }

    const data = {
      employeeId,
      date,
      amount: Number(formData.get('amount')),
      status: editingShift ? editingShift.status : 'pending',
      notes: formData.get('notes') as string,
      isHalfDay: formData.get('isHalfDay') === 'on',
      hoursWorked: formData.get('hoursWorked') ? Number(formData.get('hoursWorked')) : null,
    };

    const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
    const method = editingShift ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    setIsShiftModalOpen(false);
    setEditingShift(null);
    fetchData();
  };

  const bulkDeleteShifts = async () => {
    if (selectedShifts.length === 0) return;
    
    try {
      const res = await fetch('/api/shifts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedShifts })
      });
      if (res.ok) {
        setSelectedShifts([]);
        fetchData();
        setSuccess('Registros excluídos com sucesso!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro retornado pelo servidor na exclusão em massa:', errorData);
        setError('Erro ao excluir registros: ' + (errorData.message || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro na exclusão em massa:', err);
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };

  const toggleShiftSelection = (id: number) => {
    setSelectedShifts(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const toggleAllShifts = (ids: number[]) => {
    if (selectedShifts.length === ids.length) {
      setSelectedShifts([]);
    } else {
      setSelectedShifts(ids);
    }
  };

  const toggleEmployeeExpansion = (employeeId: number) => {
    setExpandedEmployees(prev => 
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    );
  };

  const getGroupedShifts = () => {
    return employees.map(emp => {
      const empShifts = shifts.filter(s => s.employeeId === emp.id && (
        s.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      ) && (
        statusFilter === 'all' || s.status === statusFilter
      ) && (
        (startDate ? s.date >= startDate : true) && 
        (endDate ? s.date <= endDate : true)
      ));
      
      return {
        employee: emp,
        shifts: empShifts,
        totalAmount: empShifts.reduce((acc, s) => acc + s.amount, 0),
        pendingAmount: empShifts.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0),
        paidAmount: empShifts.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.amount, 0),
      };
    }).filter(group => group.shifts.length > 0);
  };

  const getOrderStats = (orderId: number) => {
    const steps = productionSteps.filter(s => s.orderId === orderId);
    const cutting = steps.filter(s => s.stepType === 'cutting').reduce((acc, s) => acc + s.quantity, 0);
    const sewing = steps.filter(s => s.stepType === 'sewing').reduce((acc, s) => acc + s.quantity, 0);
    const finishing = steps.filter(s => s.stepType === 'finishing').reduce((acc, s) => acc + s.quantity, 0);
    
    const allocatedEmployees = [...new Set(steps.map(s => s.employeeId))].map(id => {
        const emp = employees.find(e => e.id === id);
        const empSteps = steps.filter(s => s.employeeId === id);
        return {
            ...emp,
            totalProduced: empSteps.reduce((acc, s) => acc + s.quantity, 0),
            steps: empSteps
        };
    });

    return { cutting, sewing, finishing, allocatedEmployees };
  };

  const deleteShift = async (id: number) => {
    triggerConfirm('Excluir Diária', 'Deseja realmente excluir esta diária?', async () => {
      try {
        const res = await fetch(`/api/shifts/${id}`, { 
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao excluir diária do servidor');
        }
        
        await fetchData();
        setSuccess('Diária excluída!');
      } catch (err) {
        setError('Não foi possível excluir: ' + (err as Error).message);
      }
    });
  };

  const toggleShiftStatus = async (shift: DailyShift) => {
    const newStatus = shift.status === 'pending' ? 'paid' : 'pending';
    
    try {
      // If marking as paid, we should ideally create the financial transaction first or atomically
      // But for now, we'll do it in sequence and handle errors
      if (newStatus === 'paid') {
        const emp = employees.find(e => e.id === shift.employeeId);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // Use local date instead of UTC to avoid "next day" issues in late night operations
        const dateStr = now.toLocaleDateString('en-CA');
        
        const financeRes = await fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            category: 'Mão de Obra',
            amount: Number(shift.amount),
            paidAmount: Number(shift.amount),
            date: dateStr,
            description: `Pagamento Diária #${shift.id}: ${emp?.name || 'Funcionário'} - Ref: ${formatDate(shift.date)} (${timeStr})`,
            clientName: emp?.name || 'Funcionário',
            relatedId: shift.id,
            status: 'completed'
          })
        });

        if (!financeRes.ok) {
          const errorData = await financeRes.json();
          // If it's a duplicate, we might want to proceed anyway if the user is trying to fix a desync
          if (!errorData.error?.includes('Já existe uma transação idêntica')) {
            throw new Error(`Erro ao criar lançamento financeiro: ${errorData.error}`);
          }
        }
      } else {
        // Find and delete related transaction if it exists
        const relatedTx = transactions.find(t => t.relatedId === shift.id && t.category === 'Mão de Obra');
        if (relatedTx) {
          await fetch(`/api/financial-transactions/${relatedTx.id}`, { method: 'DELETE' });
        }
      }

      // Update shift status
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...shift, status: newStatus })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao atualizar status da diária');
      }

      await fetchData();
      setSuccess(newStatus === 'paid' ? 'Diária paga e lançada no financeiro!' : 'Pagamento estornado.');
    } catch (err) {
      console.error('Error toggling shift status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar status da diária');
    }
  };

  const bulkPayShifts = () => {
    if (selectedShifts.length === 0) return;
    const shiftsToPay = shifts.filter(s => selectedShifts.includes(s.id) && s.status === 'pending');
    if (shiftsToPay.length === 0) {
      setSuccess('Nenhuma diária pendente selecionada.');
      return;
    }
    setIsGroupedFinanceModalOpen(true);
  };

  const processBulkPayShifts = async () => {
    if (selectedShifts.length === 0) return;

    try {
      // We allow both pending and paid shifts to be processed if explicitly selected, 
      // to help fix cases where the financial launch might have failed previously.
      const shiftsToProcess = shifts.filter(s => selectedShifts.includes(s.id));
      
      if (shiftsToProcess.length === 0) {
        setIsGroupedFinanceModalOpen(false);
        return;
      }

      // Group by employee
      const employeeGroups: { [key: number]: { name: string, amount: number, ids: number[], pendingIds: number[] } } = {};
      
      for (const shift of shiftsToProcess) {
        if (!employeeGroups[shift.employeeId]) {
          const emp = employees.find(e => e.id === shift.employeeId);
          employeeGroups[shift.employeeId] = { name: emp?.name || 'Funcionário', amount: 0, ids: [], pendingIds: [] };
        }
        employeeGroups[shift.employeeId].amount += Number(shift.amount);
        employeeGroups[shift.employeeId].ids.push(shift.id);
        if (shift.status === 'pending') {
          employeeGroups[shift.employeeId].pendingIds.push(shift.id);
        }
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      // Use local date instead of UTC to avoid "next day" issues in late night operations
      const dateStr = now.toLocaleDateString('en-CA');
      
      let successCount = 0;
      let failCount = 0;
      let lastErrorMessage = '';

      for (const empIdStr in employeeGroups) {
        const empId = parseInt(empIdStr);
        const group = employeeGroups[empId];
        
        // 1. Create financial transaction first
        const financeRes = await fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            category: 'Mão de Obra',
            amount: group.amount,
            paidAmount: group.amount,
            date: dateStr,
            description: `Pagamento Lote Diárias: ${group.name} (${group.ids.length} diárias) - ${timeStr}`,
            clientName: group.name,
            status: 'completed'
          })
        });

        const resData = await financeRes.json();

        if (financeRes.ok || resData.error?.includes('Já existe uma transação idêntica')) {
          // 2. If finance succeeded (or was already there), update the shifts to 'paid'
          const shiftsToUpdate = shiftsToProcess.filter(s => s.employeeId === empId && s.status === 'pending');
          
          for (const shift of shiftsToUpdate) {
            await fetch(`/api/shifts/${shift.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...shift, status: 'paid' })
            });
          }
          successCount++;
        } else {
          console.error(`Falha ao criar transação para ${group.name}:`, resData.error);
          lastErrorMessage = resData.error || 'Erro desconhecido';
          failCount++;
        }
      }

      setSelectedShifts([]);
      setIsGroupedFinanceModalOpen(false);
      await fetchData();
      
      if (failCount === 0) {
        setSuccess('Pagamentos realizados e integrados ao financeiro!');
      } else {
        setError(`Erro em alguns lançamentos: ${successCount} sucessos, ${failCount} falhas. Último erro: ${lastErrorMessage}`);
      }
    } catch (err) {
      console.error('Error processing payments in batch:', err);
      setError('Erro ao processar pagamentos em lote. Verifique o console para detalhes.');
    }
  };

  const updateCompanySettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Handle logo file
    const logoFile = (e.currentTarget.elements.namedItem('logo') as HTMLInputElement).files?.[0];
    let logoUrl = companySettings.logo_url;
    
    if (logoFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoFile);
      });
      logoUrl = base64;
    }

    try {
      const res = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, logo_url: logoUrl })
      });
      
      if (res.ok) {
        const result = await res.json();
        setCompanySettings(result.data);
        setSuccess('Configurações da empresa atualizadas com sucesso!');
      } else {
        setError('Erro ao atualizar configurações da empresa');
      }
    } catch (err) {
      setError('Erro de conexão ao atualizar configurações');
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/api/system/backup');
      if (!response.ok) throw new Error('Falha ao gerar backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_supabase_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Backup gerado com sucesso!');
    } catch (err) {
      setError('Erro ao realizar backup dos dados.');
    }
  };

  const resetApp = async () => {
    setIsResetModalOpen(true);
  };

  const handleReset = async () => {
    if (resetConfirmText !== 'RESETAR') {
      setError('O texto de confirmação não confere.');
      return;
    }

    try {
      const res = await fetch('/api/system/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSuccess('Sistema resetado com sucesso!');
        setIsResetModalOpen(false);
        setResetConfirmText('');
        fetchData();
        setView('dashboard');
      } else {
        setError('Erro ao resetar: ' + data.message);
      }
    } catch (err) {
      setError('Erro de conexão ao tentar resetar o sistema.');
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const filteredShifts = shifts.filter(shift => {
      const matchesSearch = shift.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           shift.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const tableData = filteredShifts.map(shift => [
      shift.employeeName,
      formatDate(shift.date),
      `R$ ${shift.amount.toFixed(2)}${shift.isHalfDay ? ' (Meia)' : ''}`,
      shift.status === 'paid' ? 'Pago' : 'Pendente',
      shift.notes || '-'
    ]);

    const totalPaid = filteredShifts
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0);
    const totalPending = filteredShifts
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);
    const totalGeneral = totalPaid + totalPending;

    const startY = addPDFHeader(doc, 'Relatório de Diárias');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total Pago: R$ ${totalPaid.toFixed(2)}`, 14, startY - 5);
    doc.text(`Total Pendente: R$ ${totalPending.toFixed(2)}`, 14, startY + 2);
    doc.text(`Total Geral: R$ ${totalGeneral.toFixed(2)}`, 14, startY + 9);
    doc.text(`Data de Emissão: ${formatDate(new Date().toISOString().split('T')[0])}`, 14, startY + 16);

    autoTable(doc, {
      head: [['Funcionário', 'Data', 'Valor', 'Status', 'Observações']],
      body: tableData,
      startY: startY + 22,
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600 color
    });
    doc.save(`relatorio_diarias_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportIndividualShiftPDF = (shift: DailyShift & { employeeName?: string }) => {
    const doc = new jsPDF();
    const startY = addPDFHeader(doc, 'Relatório de Diária Individual');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Gerado em: ${formatDate(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString('pt-BR')}`, 14, startY - 5);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Campo', 'Valor']],
      body: [
        ['Funcionário', shift.employeeName || '-'],
        ['Data', formatDate(shift.date)],
        ['Horas Trabalhadas', shift.hoursWorked ? `${shift.hoursWorked}h` : '-'],
        ['Valor', `R$ ${shift.amount.toFixed(2)}${shift.isHalfDay ? ' (Meia)' : ''}`],
        ['Status', shift.status === 'paid' ? 'Pago' : 'Pendente'],
        ['Observações', shift.notes || '-'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`diaria_${shift.employeeName?.replace(/\s+/g, '_').toLowerCase()}_${shift.date}.pdf`);
  };

  const generatePaymentReceiptPDF = (shift: DailyShift & { employeeName?: string }) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Find employee details
    const employee = employees.find(e => e.id === shift.employeeId);
    
    // Draw a nice border around the page
    doc.setDrawColor(79, 70, 229); // Indigo-600
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, pageHeight - (margin * 2) + 10);
    
    const startY = addPDFHeader(doc, 'RECIBO DE PAGAMENTO');
    
    // Receipt Number and Date
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº RECIBO: ${shift.id.toString().padStart(6, '0')}`, pageWidth - margin - 5, startY - 10, { align: 'right' });
    doc.text(`DATA: ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth - margin - 5, startY - 5, { align: 'right' });
    
    let currentY = startY + 10;
    
    // Value Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(pageWidth - margin - 60, currentY - 8, 60, 12, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(pageWidth - margin - 60, currentY - 8, 60, 12, 'S');
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR: R$ ${shift.amount.toFixed(2)}`, pageWidth - margin - 5, currentY, { align: 'right' });
    
    currentY += 15;
    
    // Main Receipt Text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // slate-700
    
    const receiptText = `Recebi de ${companySettings.name}, inscrita sob o documento ${companySettings.document_number || '---'}, a importância de R$ ${shift.amount.toFixed(2)} (${numberToWords(shift.amount)}), referente ao pagamento de diária de trabalho.`;
    
    const splitText = doc.splitTextToSize(receiptText, pageWidth - (margin * 2));
    doc.text(splitText, margin, currentY, { lineHeightFactor: 1.4 });
    
    currentY += (splitText.length * 7) + 10;
    
    // Employee Details Section
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, pageWidth - (margin * 2), 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('DADOS DO FAVORECIDO:', margin + 5, currentY + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`Nome: ${employee?.name || shift.employeeName || '-'}`, margin + 5, currentY + 12);
    doc.text(`CPF: ${employee?.cpf || '---'}`, margin + 5, currentY + 17);
    doc.text(`Endereço: ${employee?.address || '---'}`, margin + 5, currentY + 22);
    doc.text(`Chave PIX: ${employee?.pix_key || '---'}`, pageWidth / 2 + 10, currentY + 17);
    
    currentY += 35;
    
    // Details Table
    autoTable(doc, {
      startY: currentY,
      head: [['Descrição do Serviço', 'Data', 'Horas', 'Valor Unitário', 'Total']],
      body: [
        [
          'Diária de Trabalho' + (shift.isHalfDay ? ' (Meia Diária)' : ''),
          formatDate(shift.date),
          shift.hoursWorked ? `${shift.hoursWorked}h` : '8h',
          `R$ ${shift.amount.toFixed(2)}`,
          `R$ ${shift.amount.toFixed(2)}`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Location and Date
    doc.setFontSize(10);
    doc.text(`${companySettings.city || 'Cidade'}, ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 25;
    
    // Signature lines
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.line(margin + 10, currentY, margin + 80, currentY);
    doc.line(pageWidth - margin - 80, currentY, pageWidth - margin - 10, currentY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('EMITENTE', margin + 45, currentY + 5, { align: 'center' });
    doc.text('FAVORECIDO', pageWidth - margin - 45, currentY + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(companySettings.name, margin + 45, currentY + 10, { align: 'center' });
    doc.text(employee?.name || shift.employeeName || 'Funcionário', pageWidth - margin - 45, currentY + 10, { align: 'center' });
    
    if (companySettings.document_number) {
      doc.text(`CNPJ/CPF: ${companySettings.document_number}`, margin + 45, currentY + 14, { align: 'center' });
    }
    if (employee?.cpf) {
      doc.text(`CPF: ${employee.cpf}`, pageWidth - margin - 45, currentY + 14, { align: 'center' });
    }

    doc.save(`recibo_${shift.employeeName?.replace(/\s+/g, '_').toLowerCase()}_${shift.date}.pdf`);
  };

  // Helper function to convert number to words (simplified for BRL)
  const numberToWords = (amount: number) => {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    
    const formatPart = (n: number) => {
      if (n === 0) return 'zero';
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        const t = Math.floor(n / 10);
        const u = n % 10;
        return tens[t] + (u > 0 ? ' e ' + units[u] : '');
      }
      if (n < 1000) {
        const c = Math.floor(n / 100);
        const rest = n % 100;
        const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
        if (n === 100) return 'cem';
        return hundreds[c] + (rest > 0 ? ' e ' + formatPart(rest) : '');
      }
      return n.toString(); // Fallback for large numbers
    };
    
    let result = formatPart(integerPart) + (integerPart === 1 ? ' real' : ' reais');
    if (decimalPart > 0) {
      result += ' e ' + formatPart(decimalPart) + (decimalPart === 1 ? ' centavo' : ' centavos');
    }
    return result;
  };

  const generateBatchPaymentReceiptPDF = () => {
    if (selectedShifts.length === 0) return;
    
    setSuccess('Gerando recibos em lote...');
    
    try {
      const selectedShiftsData = shifts.filter(s => selectedShifts.includes(s.id));
      
      const groupedByEmployee = selectedShiftsData.reduce((acc, shift) => {
        const empId = shift.employeeId;
        if (!acc[empId]) acc[empId] = [];
        acc[empId].push(shift);
        return acc;
      }, {} as Record<number, DailyShift[]>);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      
      let firstPage = true;
      
      Object.entries(groupedByEmployee).forEach(([empIdStr, empShifts]) => {
        const empId = parseInt(empIdStr);
        const employee = employees.find(e => e.id === empId);
        const empName = employee?.name || 'Sem Nome';
        const shiftsList = empShifts as DailyShift[];
        
        if (!firstPage) {
          doc.addPage();
        }
        firstPage = false;
        
        // Draw a nice border around the page
        doc.setDrawColor(79, 70, 229); // Indigo-600
        doc.setLineWidth(0.3);
        doc.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, pageHeight - (margin * 2) + 8);
        
        const startY = addPDFHeader(doc, 'RECIBO DE PAGAMENTO EM LOTE');
        
        const totalAmount = shiftsList.reduce((sum, s) => sum + Number(s.amount), 0);
        const totalHours = shiftsList.reduce((sum, s) => sum + (Number(s.hoursWorked) || 8), 0);
        
        // Sort dates to show them in order
        const sortedShifts = [...shiftsList].sort((a, b) => a.date.localeCompare(b.date));
        const dates = sortedShifts.map(s => formatDate(s.date)).join(', ');
        
        // Receipt Info
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(`LOTE Nº: ${new Date().getTime().toString().slice(-6)}`, pageWidth - margin - 5, startY - 12, { align: 'right' });
        doc.text(`DATA: ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth - margin - 5, startY - 8, { align: 'right' });
        
        let currentY = startY + 5;
        
        // Value Box
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(pageWidth - margin - 55, currentY - 6, 55, 10, 'F');
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.rect(pageWidth - margin - 55, currentY - 6, 55, 10, 'S');
        
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL: R$ ${totalAmount.toFixed(2)}`, pageWidth - margin - 5, currentY, { align: 'right' });
        
        currentY += 10;
        
        // Main Receipt Text
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700
        
        const receiptText = `Recebi de ${companySettings.name}, a importância de R$ ${totalAmount.toFixed(2)} (${numberToWords(totalAmount)}), referente ao pagamento de ${shiftsList.length} diárias de trabalho (${totalHours} horas totais), realizadas nas seguintes datas: ${dates}.`;
        
        const splitText = doc.splitTextToSize(receiptText, pageWidth - (margin * 2));
        doc.text(splitText, margin, currentY, { lineHeightFactor: 1.3 });
        
        currentY += (splitText.length * 6) + 6;

        // Employee Details Section
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, currentY, pageWidth - (margin * 2), 22, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text('DADOS DO FAVORECIDO:', margin + 4, currentY + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(`Nome: ${employee?.name || empName}`, margin + 4, currentY + 10);
        doc.text(`CPF: ${employee?.cpf || '---'}`, margin + 4, currentY + 15);
        doc.text(`Endereço: ${employee?.address || '---'}`, margin + 4, currentY + 20);
        doc.text(`Chave PIX: ${employee?.pix_key || '---'}`, pageWidth / 2 + 10, currentY + 15);
        
        currentY += 28;
        
        // Details Table
        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Horas', 'Valor Unitário', 'Total']],
          body: sortedShifts.map(s => [
            formatDate(s.date),
            s.hoursWorked ? `${s.hoursWorked}h` : '8h',
            `R$ ${Number(s.amount).toFixed(2)}`,
            `R$ ${Number(s.amount).toFixed(2)}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 7, cellPadding: 1.5 },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 10;
        
        // Check if we need a new page for signatures if table is too long
        if (currentY > pageHeight - 50) {
          doc.addPage();
          // Redraw border on new page
          doc.setDrawColor(79, 70, 229);
          doc.rect(margin - 4, margin - 4, pageWidth - (margin * 2) + 8, pageHeight - (margin * 2) + 8);
          currentY = margin + 15;
        }
        
        // Location and Date
        doc.setFontSize(9);
        doc.text(`${companySettings.city || 'Cidade'}, ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 18;
        
        // Signature lines
        doc.setDrawColor(148, 163, 184); // slate-400
        doc.line(margin + 10, currentY, margin + 75, currentY);
        doc.line(pageWidth - margin - 75, currentY, pageWidth - margin - 10, currentY);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('EMITENTE', margin + 42.5, currentY + 4, { align: 'center' });
        doc.text('FAVORECIDO', pageWidth - margin - 42.5, currentY + 4, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(companySettings.name, margin + 42.5, currentY + 8, { align: 'center' });
        doc.text(employee?.name || empName, pageWidth - margin - 42.5, currentY + 8, { align: 'center' });
        
        if (companySettings.document_number) {
          doc.text(`CNPJ/CPF: ${companySettings.document_number}`, margin + 42.5, currentY + 11, { align: 'center' });
        }
        if (employee?.cpf) {
          doc.text(`CPF: ${employee.cpf}`, pageWidth - margin - 42.5, currentY + 11, { align: 'center' });
        }
      });
      
      doc.save(`recibos_lote_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess('Recibos gerados com sucesso!');
    } catch (err) {
      console.error('Error generating batch PDF:', err);
      setError('Erro ao gerar recibos em lote.');
    }
  };

  const exportReportToPDF = (reportData: any[]) => {
    setSuccess('Iniciando geração do relatório...');
    try {
      const doc = new jsPDF();
      const startY = addPDFHeader(doc, 'Relatório de Horas e Valores');
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Fim'}`, 14, startY - 5);
      doc.text(`Gerado em: ${formatDate(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString('pt-BR')}`, 14, startY + 2);

      const tableData = reportData.map(item => [
        item.name || '-',
        item.totalShifts || 0,
        `${item.totalHours || 0}h`,
        `R$ ${Number(item.totalAmount || 0).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: startY + 10,
        head: [['Funcionário', 'Total de Diárias', 'Total de Horas', 'Total a Pagar']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`relatorio_horas_${new Date().getTime()}.pdf`);
      setSuccess('Relatório baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Erro ao gerar o relatório PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setSuccess('');
    }
  };

  const exportFinancialReportPDF = () => {
    setSuccess('Iniciando geração do relatório...');
    try {
      const doc = new jsPDF();
      
      const filteredTransactions = transactions.filter(t => {
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const search = (searchTerm || '').toLowerCase();
        
        const matchesSearch = desc.includes(search) || cat.includes(search);
        const matchesDate = (startDate ? t.date >= startDate : true) && 
                           (endDate ? t.date <= endDate : true);
        return matchesSearch && matchesDate;
      });

      if (filteredTransactions.length === 0) {
        setError('Nenhuma transação encontrada para o período selecionado.');
        setSuccess('');
        return;
      }

      const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const balance = income - expense;

      const startY = addPDFHeader(doc, 'Relatório Financeiro');
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const periodText = `Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Fim'}`;
      doc.text(periodText, 14, startY - 5);
      doc.text(`Gerado em: ${formatDate(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString('pt-BR')}`, 14, startY + 2);

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Entradas: R$ ${income.toFixed(2)}`, 14, startY + 12);
      doc.text(`Total Saídas: R$ ${expense.toFixed(2)}`, 14, startY + 19);
      doc.text(`Saldo: R$ ${balance.toFixed(2)}`, 14, startY + 26);

      const tableData = filteredTransactions.map(t => [
        formatDate(t.date),
        t.description || '-',
        t.category || '-',
        t.type === 'income' ? 'Entrada' : 'Saída',
        `R$ ${Number(t.amount || 0).toFixed(2)}`,
        t.status === 'completed' ? 'Efetivado' : 'Pendente'
      ]);

      autoTable(doc, {
        startY: startY + 35,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
        margin: { top: startY + 35 }
      });

      const fileName = `financeiro_${new Date().getTime()}.pdf`;
      doc.save(fileName);
      setSuccess('Relatório baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Erro ao gerar o relatório PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setSuccess('');
    }
  };

  const exportAllDetailedReportToPDF = (reportData: any[]) => {
    setSuccess('Iniciando geração do relatório detalhado...');
    try {
      const doc = new jsPDF();
      
      reportData.forEach((item, index) => {
        if (index > 0) {
          doc.addPage();
        }

        const startY = addPDFHeader(doc, 'Relatório Detalhado de Diárias');
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Fim'}`, 14, startY - 5);
        doc.text(`Gerado em: ${formatDate(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString('pt-BR')}`, 14, startY + 2);

        let currentY = startY + 10;

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`Funcionário: ${item.name || 'N/A'}`, 14, currentY);
        currentY += 7;

        const shifts = Array.isArray(item.shifts) ? item.shifts : [];
        const tableData = [...shifts].sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')).map((shift: any) => [
          formatDate(shift.date),
          shift.hoursWorked ? `${shift.hoursWorked}h` : '-',
          `R$ ${Number(shift.amount || 0).toFixed(2)}${shift.isHalfDay ? ' (Meia)' : ''}`,
          shift.status === 'paid' ? 'Pago' : 'Pendente',
          shift.notes || '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Horas', 'Valor', 'Status', 'Observações']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
        });

        currentY = (doc as any).lastAutoTable?.finalY + 10 || currentY + 20;
        doc.setFontSize(11);
        doc.text(`Total de Horas: ${item.totalHours || 0}h | Valor Total: R$ ${Number(item.totalAmount || 0).toFixed(2)}`, 14, currentY);
      });

      doc.save(`relatorio_detalhado_geral_${new Date().getTime()}.pdf`);
      setSuccess('Relatório detalhado baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Erro ao gerar o relatório detalhado: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      setSuccess('');
    }
  };

  const exportEmployeeGroupedPDF = (employeeName: string, employeeShifts: (DailyShift & { employeeName?: string })[]) => {
    try {
      const doc = new jsPDF();
      const startY = addPDFHeader(doc, `Relatório Individual: ${employeeName}`);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Fim'}`, 14, startY - 5);
      doc.text(`Gerado em: ${formatDate(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString('pt-BR')}`, 14, startY + 2);

      const tableData = employeeShifts.sort((a, b) => b.date.localeCompare(a.date)).map(shift => [
        formatDate(shift.date),
        shift.hoursWorked ? `${shift.hoursWorked}h` : '-',
        `R$ ${Number(shift.amount).toFixed(2)}${shift.isHalfDay ? ' (Meia)' : ''}`,
        shift.status === 'paid' ? 'Pago' : 'Pendente',
        shift.notes || '-'
      ]);

      const totalAmount = employeeShifts.reduce((sum, s) => sum + Number(s.amount), 0);
      const totalHours = employeeShifts.reduce((sum, s) => sum + (Number(s.hoursWorked) || 0), 0);

      autoTable(doc, {
        startY: startY + 10,
        head: [['Data', 'Horas', 'Valor', 'Status', 'Observações']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Total de Horas: ${totalHours}h`, 14, finalY + 10);
      doc.text(`Valor Total: R$ ${totalAmount.toFixed(2)}`, 14, finalY + 17);

      doc.save(`relatorio_agrupado_${employeeName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccess(`Relatório de ${employeeName} exportado com sucesso!`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Erro ao gerar o relatório individual.');
    }
  };

  const getReportData = () => {
    const filteredShifts = shifts.filter(s => {
      const matchesDate = (startDate ? s.date >= startDate : true) && 
                         (endDate ? s.date <= endDate : true);
      const matchesStatus = reportStatusFilter === 'all' || s.status === reportStatusFilter;
      return matchesDate && matchesStatus;
    });

    const report: Record<number, { 
      id: number,
      name: string, 
      totalHours: number, 
      totalAmount: number, 
      totalShifts: number,
      shifts: (DailyShift & { employeeName?: string })[]
    }> = {};

    filteredShifts.forEach(s => {
      if (!report[s.employeeId]) {
        report[s.employeeId] = { 
          id: s.employeeId,
          name: s.employeeName || 'Desconhecido', 
          totalHours: 0, 
          totalAmount: 0, 
          totalShifts: 0,
          shifts: []
        };
      }
      report[s.employeeId].totalHours += s.hoursWorked || 0;
      report[s.employeeId].totalAmount += s.amount;
      report[s.employeeId].totalShifts += 1;
      report[s.employeeId].shifts.push(s);
    });

    return Object.values(report);
  };

  // --- Renderers ---

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <Logo size={80} className="mb-6" />
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-[#2d3436]">Confecção</span>
              <span className="text-[#7b2cbf] ml-1">Pro</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Gestão Inteligente para seu Ateliê</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
              <input 
                type="text" 
                className="input"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="input pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[34px] text-slate-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="btn-primary w-full py-3">
              Entrar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
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
          <button 
            onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm border border-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Calendar size={20} className={view === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'} />
            Painel Geral
          </button>
          <button 
            onClick={() => { setView('partners'); setPartnerTab('clients'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'partners' ? 'bg-cyan-50 text-cyan-700 font-bold shadow-sm border border-cyan-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <UserCheck size={20} className={view === 'partners' ? 'text-cyan-600' : 'text-slate-400'} />
            Parceiros
          </button>
          <button 
            onClick={() => { setView('production'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'production' ? 'bg-rose-50 text-rose-700 font-bold shadow-sm border border-rose-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Scissors size={20} className={view === 'production' ? 'text-rose-600' : 'text-slate-400'} />
            Produção
          </button>
          <button 
            onClick={() => { setView('shifts'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'shifts' ? 'bg-sky-50 text-sky-700 font-bold shadow-sm border border-sky-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Clock size={20} className={view === 'shifts' ? 'text-sky-600' : 'text-slate-400'} />
            Diária
          </button>
          <button 
            onClick={() => { setView('finance'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'finance' ? 'bg-amber-50 text-amber-700 font-bold shadow-sm border border-amber-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp size={20} className={view === 'finance' ? 'text-amber-600' : 'text-slate-400'} />
            Financeiro
          </button>
          <button 
            onClick={() => { setView('reports'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'reports' ? 'bg-violet-50 text-violet-700 font-bold shadow-sm border border-violet-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FileDown size={20} className={view === 'reports' ? 'text-violet-600' : 'text-slate-400'} />
            Relatórios
          </button>
          <button 
            onClick={() => { setView('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] ${view === 'settings' ? 'bg-slate-100 text-slate-700 font-bold shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings size={20} className={view === 'settings' ? 'text-slate-600' : 'text-slate-400'} />
            Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
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
              <button 
                onClick={() => { setEditingShift(null); setIsShiftModalOpen(true); }}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <Plus size={18} /> LANÇAR DIÁRIA
              </button>
            )}
            {view === 'production' && (
              <div className="flex flex-col gap-2 w-full">
                {productionTab === 'orders' ? (
                  <>
                    <button 
                      onClick={() => { 
                        setEditingProductionOrder(null); 
                        setOrderItems([]);
                        setItemsBreakdown([]);
                        setSelectedProductIdForOrder(null);
                        setOrderItemColor('');
                        setOrderItemSheets('');
                        setOrderItemGrid('');
                        setIsProductionOrderModalOpen(true); 
                      }}
                      className="w-full py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                    >
                      <Plus size={18} /> NOVA ORDEM
                    </button>
                    <button 
                      onClick={() => { setRepairItemsBreakdown([]); setIsRepairModalOpen(true); }}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                    >
                      <Plus size={18} /> CONCERTO
                    </button>
                  </>
                ) : productionTab === 'repairs' ? (
                  <button 
                    onClick={() => { setRepairItemsBreakdown([]); setIsRepairModalOpen(true); }}
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <Plus size={18} /> NOVO CONCERTO
                  </button>
                ) : (
                  <button 
                    onClick={() => { setEditingProduct({ id: 0, name: '', photos: [], colors: [], sizes: [], active: true, productionValue: 0 }); setIsProductModalOpen(true); }}
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <Plus size={18} /> NOVO PRODUTO
                  </button>
                )}
              </div>
            )}
            {view === 'partners' && (
              <div className="flex flex-col gap-2 w-full">
                <button 
                  onClick={() => { setPartnerTab('clients'); setEditingClient(null); setIsClientModalOpen(true); }}
                  className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                  <Plus size={18} /> NOVO CLIENTE
                </button>
                <button 
                  onClick={() => { setPartnerTab('employees'); setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                  <Plus size={18} /> NOVO FUNCIONÁRIO
                </button>
              </div>
            )}
            {view === 'finance' && (
              <button 
                onClick={() => setIsFinanceModalOpen(true)}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                <Plus size={18} /> NOVA TRANSAÇÃO
              </button>
            )}
          </div>
        </header>

        {/* Search and Filters for CRUD views */}
        {(view === 'dashboard' || view === 'partners' || view === 'shifts') && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {true && (
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder={view === 'partners' ? (partnerTab === 'employees' ? 'Pesquisar funcionários...' : 'Pesquisar parceiros...') : view === 'dashboard' ? 'Pesquisar lançamentos...' : 'Pesquisar registros...'}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
              
              {view === 'shifts' && (
                <div className="flex gap-2">
                  <select 
                    className="bg-white border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm text-slate-600 font-medium"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendentes</option>
                    <option value="paid">Pagos</option>
                  </select>
                  
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('pending');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm"
                    title="Limpar Filtros"
                  >
                    <RefreshCcw size={20} />
                  </button>
                </div>
              )}
            </div>

            {view === 'shifts' && (
              <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Filter size={16} />
                  <span>Filtrar por data:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input 
                    type="date" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-slate-400">até</span>
                  <input 
                    type="date" 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center gap-3"
            >
              <AlertTriangle size={20} />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </motion.div>
          )}

          {view === 'dashboard' && (
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
                  <Button 
                    variant="success"
                    size="lg"
                    onClick={() => { 
                      setEditingProductionOrder(null); 
                      setOrderItems([]);
                      setItemsBreakdown([]);
                      setSelectedProductIdForOrder(null);
                      setOrderItemColor('');
                      setOrderItemSheets('');
                      setOrderItemGrid('');
                      setIsProductionOrderModalOpen(true); 
                    }}
                    className="flex-col h-auto py-6 gap-3"
                    leftIcon={<Package size={28} />}
                  >
                    <span className="text-[10px] font-bold uppercase">Nova Ordem</span>
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={() => setIsFinanceModalOpen(true)}
                    className="flex-col h-auto py-6 gap-3"
                    leftIcon={<DollarSign size={28} />}
                  >
                    <span className="text-[10px] font-bold uppercase">Nova Transação</span>
                  </Button>
                  <Button 
                    variant="success"
                    size="lg"
                    onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }}
                    className="flex-col h-auto py-6 gap-3"
                    leftIcon={<UserPlus size={28} />}
                  >
                    <span className="text-[10px] font-bold uppercase">Novo Cliente</span>
                  </Button>
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
                    className="flex-col h-auto py-6 gap-3"
                    leftIcon={<UserPlus size={28} />}
                  >
                    <span className="text-[10px] font-bold uppercase">Novo Funcionário</span>
                  </Button>
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

              <div className="md:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
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

                <div className="card p-6">
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
                          <Cell fill="#94a3b8" /> {/* Planning - Slate */}
                          <Cell fill="#3b82f6" /> {/* Cutting - Blue */}
                          <Cell fill="#6366f1" /> {/* Sewing - Indigo */}
                          <Cell fill="#f59e0b" /> {/* Finishing - Amber */}
                          <Cell fill="#10b981" /> {/* Completed - Emerald */}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} peças`, 'Quantidade']} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
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
          )}

          {view === 'shifts' && (
            <motion.div 
              key="shifts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >

              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6 bg-amber-50 border-amber-100">
                    <p className="text-amber-700 text-sm font-medium mb-1">Total Pendente</p>
                    <h3 className="text-3xl font-bold text-amber-900">
                      R$ {shifts.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="card p-6 bg-emerald-50 border-emerald-100">
                    <p className="text-emerald-700 text-sm font-medium mb-1">Total Pago</p>
                    <h3 className="text-3xl font-bold text-emerald-900">
                      R$ {shifts.filter(s => s.status === 'paid').reduce((acc, s) => acc + s.amount, 0).toFixed(2)}
                    </h3>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex justify-end mb-4">
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button 
                      onClick={() => setIsGroupedView(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isGroupedView ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Agrupado
                    </button>
                    <button 
                      onClick={() => setIsGroupedView(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isGroupedView ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Individual
                    </button>
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
                    <div key={group.employee.id} className="card overflow-hidden">
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
                  <div className="card overflow-hidden">
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
              </div>

            </motion.div>
          )}

          {view === 'production' && (
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
                // List View
                <div className="space-y-6">
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
                                onClick={() => {
                                  setSelectedProductionOrderId(order.id);
                                  setIsProductionOrderDetailModalOpen(true);
                                }}
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
                                      setOrderItems((order.items || []).map(item => ({
                                        ...item,
                                        unitPrice: item.unitPrice !== undefined ? item.unitPrice : (order.unitPrice || 0)
                                      })));
                                      setItemsBreakdown([]);
                                      setSelectedProductIdForOrder(null);
                                      setOrderItemColor('');
                                      setOrderItemSheets('');
                                      setOrderItemGrid('');
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
              ) : (
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
                          <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                                <img src={photo} alt="" className="w-full h-full object-cover" />
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
                        onClick={() => { setEditingProduct({ id: 0, name: '', photos: [], colors: [], sizes: [], active: true, productionValue: 0 }); setIsProductModalOpen(true); }}
                        className="mt-6 btn-primary inline-flex"
                      >
                        <Plus size={20} className="mr-2" /> Cadastrar Primeiro Produto
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
          {view === 'partners' && (
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
          )}

          {view === 'finance' && (
            <motion.div 
              key="finance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Finance Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 bg-emerald-50 border-emerald-100">
                  <p className="text-emerald-700 text-xs font-medium uppercase tracking-wider mb-1">Saldo em Caixa</p>
                  <h3 className="text-xl font-bold text-emerald-900">
                    R$ {(
                      transactions.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0) +
                      transactions.filter(t => t.status === 'partial').reduce((acc, t) => acc + (t.type === 'income' ? t.paidAmount : -t.paidAmount), 0)
                    ).toFixed(2)}
                  </h3>
                </div>
                <div className="card p-4 bg-amber-50 border-amber-100">
                  <p className="text-amber-700 text-xs font-medium uppercase tracking-wider mb-1">A Receber</p>
                  <h3 className="text-xl font-bold text-amber-900">
                    R$ {transactions.filter(t => t.type === 'income' && t.status !== 'completed' && isOverdueOrCurrentMonth(t)).reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="card p-4 bg-red-50 border-red-100">
                  <p className="text-red-700 text-xs font-medium uppercase tracking-wider mb-1">A Pagar</p>
                  <h3 className="text-xl font-bold text-red-900">
                    R$ {transactions.filter(t => t.type === 'expense' && t.status !== 'completed' && isOverdueOrCurrentMonth(t)).reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="card p-4 bg-indigo-50 border-indigo-100">
                  <p className="text-indigo-700 text-xs font-medium uppercase tracking-wider mb-1">Conciliado</p>
                  <h3 className="text-xl font-bold text-indigo-900">
                    {Math.round((transactions.filter(t => t.reconciled).length / (transactions.length || 1)) * 100)}%
                  </h3>
                </div>
              </div>

              {/* Finance Tabs */}
              <div className="flex border-b border-slate-200 gap-6 overflow-x-auto scrollbar-hide">
                <button 
                  onClick={() => setFinanceTab('cashflow')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'cashflow' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Fluxo de Caixa
                  {financeTab === 'cashflow' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('receivable')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'receivable' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Contas a Receber
                  {financeTab === 'receivable' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('payable')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'payable' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Contas a Pagar
                  {financeTab === 'payable' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('reconciliation')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'reconciliation' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Conciliação
                  {financeTab === 'reconciliation' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('dre')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'dre' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  DRE
                  {financeTab === 'dre' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('balance')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'balance' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Balancete
                  {financeTab === 'balance' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('reports')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'reports' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Relatórios
                  {financeTab === 'reports' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
                <button 
                  onClick={() => setFinanceTab('history')}
                  className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${financeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Histórico
                  {financeTab === 'history' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                </button>
              </div>

              {financeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-6 bg-emerald-50 border-emerald-100">
                      <p className="text-emerald-700 text-sm font-medium mb-1">Total Entradas</p>
                      <h3 className="text-3xl font-bold text-emerald-900">
                        R$ {transactions.filter(t => t.type === 'income' && (startDate ? t.date >= startDate : true) && (endDate ? t.date <= endDate : true)).reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                      </h3>
                    </div>
                    <div className="card p-6 bg-red-50 border-red-100">
                      <p className="text-red-700 text-sm font-medium mb-1">Total Saídas</p>
                      <h3 className="text-3xl font-bold text-red-900">
                        R$ {transactions.filter(t => t.type === 'expense' && (startDate ? t.date >= startDate : true) && (endDate ? t.date <= endDate : true)).reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
                      </h3>
                    </div>
                    <div className="card p-6 bg-indigo-50 border-indigo-100">
                      <p className="text-indigo-700 text-sm font-medium mb-1">Saldo no Período</p>
                      <h3 className="text-3xl font-bold text-indigo-900">
                        R$ {(
                          transactions.filter(t => t.type === 'income' && (startDate ? t.date >= startDate : true) && (endDate ? t.date <= endDate : true)).reduce((acc, t) => acc + t.amount, 0) -
                          transactions.filter(t => t.type === 'expense' && (startDate ? t.date >= startDate : true) && (endDate ? t.date <= endDate : true)).reduce((acc, t) => acc + t.amount, 0)
                        ).toFixed(2)}
                      </h3>
                    </div>
                  </div>

                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-slate-800">Gerar Relatório Detalhado</h3>
                      <button 
                        onClick={exportFinancialReportPDF}
                        className="btn-primary"
                      >
                        <FileDown size={20} className="mr-2" /> Exportar Relatório
                      </button>
                    </div>
                    <p className="text-slate-500 text-sm">
                      O relatório será gerado com base nos filtros de data selecionados no topo da página.
                    </p>
                  </div>
                </div>
              )}

              {financeTab === 'cashflow' && (
                <div className="space-y-6">
                  <div className="card p-6">
                    <h3 className="font-bold text-slate-800 mb-6">Fluxo de Caixa Mensal</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(() => {
                          const last6Months = Array.from({ length: 6 }).map((_, i) => {
                            const d = new Date();
                            d.setMonth(d.getMonth() - (5 - i));
                            return d.toISOString().substring(0, 7);
                          });
                          return last6Months.map(month => {
                            const monthTrans = transactions.filter(t => t.date.startsWith(month) && t.status === 'completed');
                            return {
                              name: month,
                              entradas: monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
                              saidas: monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
                            };
                          });
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-bold text-slate-800">Últimas Transações</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Data</th>
                            <th className="px-6 py-4 font-semibold">Cliente/Fornecedor</th>
                            <th className="px-6 py-4 font-semibold">Descrição</th>
                            <th className="px-6 py-4 font-semibold">Categoria</th>
                            <th className="px-6 py-4 font-semibold text-right">Valor</th>
                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {transactions
                            .filter(isOverdueOrCurrentMonth)
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .slice(0, 10).map(t => (
                            <tr 
                              key={t.id} 
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => { setSelectedTransactionId(t.id); setIsTransactionDetailModalOpen(true); }}
                            >
                              <td className="px-6 py-4 text-slate-500">{formatDate(t.date)}</td>
                              <td className="px-6 py-4 text-slate-500 text-xs">{t.clientName || '-'}</td>
                              <td className="px-6 py-4 font-medium text-slate-700">
                                {t.description}
                                {t.relatedId && t.category === 'Venda de Produção' && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-bold uppercase">Produção</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{t.category}</td>
                              <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {t.status === 'completed' ? 'Efetivado' : 'Pendente'}
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
                                  {t.status !== 'pending' && (
                                    <button 
                                      onClick={() => reverseTransaction(t)}
                                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Estornar Lançamento"
                                    >
                                      <RotateCcw size={18} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => { setEditingTransaction(t); setIsFinanceModalOpen(true); }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => deleteTransaction(t.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              )}

              {financeTab === 'history' && (
                <div className="card">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Histórico Completo de Transações</h3>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Buscar transação..." 
                          className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          onChange={(e) => setFinanceSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold">Data</th>
                          <th className="px-6 py-4 font-semibold">Cliente/Fornecedor</th>
                          <th className="px-6 py-4 font-semibold">Descrição</th>
                          <th className="px-6 py-4 font-semibold">Categoria</th>
                          <th className="px-6 py-4 font-semibold text-right">Valor</th>
                          <th className="px-6 py-4 font-semibold text-center">Finalizado</th>
                          <th className="px-6 py-4 font-semibold text-center">Status</th>
                          <th className="px-6 py-4 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions
                          .filter(t => 
                            t.description.toLowerCase().includes(financeSearch.toLowerCase()) ||
                            t.category.toLowerCase().includes(financeSearch.toLowerCase())
                          )
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map(t => (
                            <tr 
                              key={t.id} 
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => { setSelectedTransactionId(t.id); setIsTransactionDetailModalOpen(true); }}
                            >
                              <td className="px-6 py-4 text-slate-500">{formatDate(t.date)}</td>
                              <td className="px-6 py-4 text-slate-500 text-xs">
                                {t.clientName?.trim() || (
                                  t.relatedId && t.category === 'Venda de Produção' 
                                    ? productionOrders.find(o => o.id === t.relatedId)?.clientName 
                                    : null
                                ) || '-'}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">{t.description}</td>
                              <td className="px-6 py-4 text-slate-500">{t.category}</td>
                              <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center text-slate-500 text-xs">
                                {t.finishedDate ? formatDate(t.finishedDate) : '-'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                  t.status === 'partial' ? 'bg-indigo-100 text-indigo-700' : 
                                  'bg-amber-100 text-amber-700'
                                }`}>
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
                                  {t.status !== 'pending' && (
                                    <button 
                                      onClick={() => reverseTransaction(t)}
                                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Estornar Lançamento"
                                    >
                                      <RotateCcw size={18} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => { setEditingTransaction(t); setIsFinanceModalOpen(true); }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => deleteTransaction(t.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h3 className="font-bold text-slate-800">
                        {financeTab === 'payable' ? 'Contas a Pagar' : 'Contas a Receber'}
                      </h3>
                      <button
                        onClick={() => generateFinanceListReport(financeTab === 'payable' ? 'expense' : 'income')}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        title="Gerar Relatório Completo em PDF"
                      >
                        <FileDown size={14} />
                        Relatório
                      </button>
                      {selectedTransactions.length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => {
                            const initialAmounts: Record<number, number> = {};
                            selectedTransactions.forEach(id => {
                              const t = transactions.find(trans => trans.id === id);
                              if (t) initialAmounts[id] = t.amount - (t.paidAmount || 0);
                            });
                            setBatchPaymentAmounts(initialAmounts);
                            setIsBatchFinanceModalOpen(true);
                          }}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-100 flex items-center gap-2"
                        >
                          <DollarSign size={14} />
                          {financeTab === 'payable' ? 'Pagar' : 'Receber'} Selecionados ({selectedTransactions.length})
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-semibold w-10">
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
                          <th className="px-6 py-4 font-semibold">Cliente/Fornecedor</th>
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
                            <tr 
                              key={t.id} 
                              className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedTransactions.includes(t.id) ? 'bg-indigo-50/30' : ''}`}
                              onClick={() => { setSelectedTransactionId(t.id); setIsTransactionDetailModalOpen(true); }}
                            >
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                            <tr 
                              key={t.id} 
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => { setSelectedTransactionId(t.id); setIsTransactionDetailModalOpen(true); }}
                            >
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
          )}

          {view === 'reports' && (
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
                      className="input w-full" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                    <input 
                      type="date" 
                      className="input w-full" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  {reportType === 'hours' && (
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status das Diárias</label>
                      <select 
                        className="input w-full"
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value as any)}
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
                        className="input w-full"
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value as any)}
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
                        className="input w-full"
                        value={reportStatusFilter}
                        onChange={(e) => setReportStatusFilter(e.target.value as any)}
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
                          className="btn-primary flex items-center justify-center gap-2 flex-1"
                          title="Exportar Tabela Detalhada de Ordens"
                        >
                          <FileDown size={20} /> Detalhado
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
                        className="btn-primary flex items-center justify-center gap-2 flex-1"
                      >
                        <FileDown size={20} /> Gerar Relatório
                      </button>
                    )}
                  </div>
                </div>

                {reportType === 'hours' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total de Horas</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          {getReportData().reduce((acc, curr) => acc + curr.totalHours, 0)}h
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total a Pagar</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          R$ {getReportData().reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)}
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total de Diárias</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          {getReportData().reduce((acc, curr) => acc + curr.totalShifts, 0)}
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Média Horas/Diária</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          {(getReportData().reduce((acc, curr) => acc + curr.totalHours, 0) / (getReportData().reduce((acc, curr) => acc + curr.totalShifts, 0) || 1)).toFixed(1)}h
                        </h4>
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
                            <tr 
                              key={idx} 
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => { setSelectedEmployeeIdForShifts(item.id); setIsShiftDetailModalOpen(true); }}
                            >
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
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total de Ordens</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).length}
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total de Peças</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).reduce((acc, curr) => acc + curr.totalPieces, 0)}
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Valor Total</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          R$ {productionOrders.filter(o => o.startDate >= startDate && o.startDate <= endDate).reduce((acc, curr) => acc + (curr.totalValue || 0), 0).toFixed(2)}
                        </h4>
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
                              <tr 
                                key={order.id} 
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                onClick={() => { setSelectedProductionOrderId(order.id); setIsProductionOrderDetailModalOpen(true); }}
                              >
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
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Entradas</p>
                        <h4 className="text-xl font-bold text-indigo-600">
                          {repairs.filter(r => r.type === 'entry').reduce((acc, curr) => acc + curr.quantity, 0)}
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Saídas</p>
                        <h4 className="text-xl font-bold text-emerald-600">
                          {repairs.filter(r => r.type === 'exit').reduce((acc, curr) => acc + curr.quantity, 0)}
                        </h4>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Saldo Pendente</p>
                        <h4 className="text-xl font-bold text-amber-600">
                          {repairs.filter(r => r.type === 'entry').reduce((acc, curr) => acc + curr.quantity, 0) - 
                           repairs.filter(r => r.type === 'exit').reduce((acc, curr) => acc + curr.quantity, 0)}
                        </h4>
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
                            <th className="px-4 py-3 font-semibold text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {repairs
                            .filter(r => {
                              if (!startDate || !endDate) return true;
                              return r.date >= startDate && r.date <= endDate;
                            })
                            .filter(r => {
                              if (reportStatusFilter === 'entry') return r.type === 'entry';
                              if (reportStatusFilter === 'exit') return r.type === 'exit';
                              return true;
                            })
                            .map(repair => (
                              <tr 
                                key={repair.id} 
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                onClick={() => { setSelectedRepairId(repair.id); setIsRepairDetailModalOpen(true); }}
                              >
                                <td className="px-4 py-3">
                                  <p className="font-medium text-slate-700 text-sm">{repair.productName}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
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
                                <td className="px-4 py-3 text-right">
                                  <button 
                                    onClick={() => deleteRepair(repair.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {repairs.filter(r => r.date >= startDate && r.date <= endDate).length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
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
          )}

          {view === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl space-y-6"
            >
              <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Status da Conexão</h3>
                    <p className="text-slate-500 text-sm">Verifique se o banco de dados está conectado</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${error && error.includes('servidor') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-sm font-medium text-slate-700">
                      {error && error.includes('servidor') ? 'Desconectado do Supabase' : 'Conectado ao Supabase'}
                    </span>
                  </div>
                  {error && error.includes('servidor') && (
                    <button 
                      onClick={() => {
                        setError('');
                        fetchData();
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Tentar Novamente"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  )}
                </div>
                
                {error && error.includes('servidor') && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs leading-relaxed">
                    <p className="font-bold mb-1">Como resolver:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Vá em <b>Settings &gt; Secrets</b> no AI Studio (menu lateral esquerdo).</li>
                      <li>Adicione as chaves: <b>VITE_SUPABASE_URL</b>, <b>VITE_SUPABASE_ANON_KEY</b> e <b>SUPABASE_SERVICE_ROLE_KEY</b>.</li>
                      <li>Certifique-se de que executou o script SQL no painel do Supabase (SQL Editor).</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Dados da Empresa (Administrador)</h3>
                    <p className="text-slate-500 text-sm">Informações que aparecerão nos relatórios e documentos</p>
                  </div>
                </div>

                <form onSubmit={updateCompanySettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa / Administrador</label>
                      <input name="name" type="text" className="input" defaultValue={companySettings.name} required />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento</label>
                      <select 
                        name="document_type" 
                        className="input" 
                        value={formDocType}
                        onChange={(e) => setFormDocType(e.target.value as 'CPF' | 'CNPJ')}
                      >
                        <option value="CNPJ">CNPJ</option>
                        <option value="CPF">CPF</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número do Documento</label>
                      <input name="document_number" type="text" className="input" defaultValue={companySettings.document_number} placeholder={formDocType === 'CNPJ' ? "00.000.000/0000-00" : "000.000.000-00"} />
                    </div>

                    {formDocType === 'CNPJ' ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                        <input name="state_registration" type="text" className="input" defaultValue={companySettings.state_registration} />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                        <input name="rg" type="text" className="input" defaultValue={companySettings.rg} />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                      <input name="address" type="text" className="input" defaultValue={companySettings.address} placeholder="Rua, Número, Bairro, Cidade - UF" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Logomarca do Administrador (Apenas para Relatórios)</label>
                      <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        {companySettings.logo_url ? (
                          <div className="relative group">
                            <img src={companySettings.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Image size={24} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <Image size={32} />
                          </div>
                        )}
                        <div className="flex-1">
                          <input 
                            name="logo" 
                            type="file" 
                            accept="image/*" 
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" 
                          />
                          <p className="mt-1 text-xs text-slate-400">PNG, JPG ou SVG. Recomendado: 200x200px (Fundo transparente)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="submit" className="btn-primary w-full md:w-auto px-8">
                      Salvar Dados da Empresa
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Configurações de Conta</h3>
                    <p className="text-slate-500 text-sm">Altere suas credenciais de acesso</p>
                  </div>
                </div>

                <form onSubmit={updateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Novo Nome de Usuário</label>
                    <input name="newUsername" type="text" className="input" defaultValue={user?.username} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                      <input name="newPassword" type="password" className="input" placeholder="••••••••" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
                      <input name="confirmPassword" type="password" className="input" placeholder="••••••••" required />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="btn-primary w-full md:w-auto px-8">
                      Atualizar Credenciais
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Backup de Segurança</h3>
                    <p className="text-slate-500 text-sm">Exporte todos os dados do sistema em formato SQL</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                  <h4 className="font-bold text-emerald-800 mb-2">Exportar Dados (SQL Dump)</h4>
                  <p className="text-emerald-700 text-sm mb-4">
                    Gere um arquivo .sql contendo todos os registros atuais das tabelas do Supabase. 
                    Este arquivo pode ser usado para restauração manual ou migração.
                  </p>
                  <button 
                    onClick={handleBackup}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    <FileDown size={20} /> Baixar Backup SQL
                  </button>
                </div>
              </div>

              <div className="card p-8 border-red-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Zona de Perigo</h3>
                    <p className="text-slate-500 text-sm">Ações irreversíveis que afetam todo o sistema</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8">
                  <h4 className="font-bold text-red-800 mb-2">Resetar Aplicativo</h4>
                  <p className="text-red-700 text-sm mb-4">
                    Esta ação apagará permanentemente todos os registros de funcionários, diárias e pagamentos. 
                    Não é possível desfazer esta operação.
                  </p>
                  <button 
                    onClick={resetApp}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    <RefreshCcw size={20} /> Resetar Tudo do Zero
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Informações do Sistema</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-slate-500">Versão</p>
                      <p className="font-bold">1.0.0</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-slate-500">Ambiente</p>
                      <p className="font-bold">Produção</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }} 
        title={editingProduct && editingProduct.id !== 0 ? "Editar Produto" : "Novo Produto"}
      >
        <form onSubmit={saveProduct} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
              <input name="name" className="input" defaultValue={editingProduct?.name} required placeholder="Ex: Camiseta Básica Algodão" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Referência</label>
              <input name="sku" className="input" defaultValue={editingProduct?.sku} placeholder="Ex: CAM-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <input name="category" className="input" defaultValue={editingProduct?.category} placeholder="Ex: Masculino" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor de Prod. (R$)</label>
              <input 
                name="productionValue" 
                type="number" 
                step="0.01" 
                className="input" 
                defaultValue={editingProduct?.productionValue || ''} 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cores</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="input" 
                  placeholder="Ex: Azul" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newColor.trim() && editingProduct) {
                        const addedColors = newColor.split(',').map(c => c.trim()).filter(c => c !== '');
                        setEditingProduct({
                          ...editingProduct,
                          colors: [...(editingProduct.colors || []), ...addedColors]
                        });
                        setNewColor('');
                      }
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (newColor.trim() && editingProduct) {
                      const addedColors = newColor.split(',').map(c => c.trim()).filter(c => c !== '');
                      setEditingProduct({
                        ...editingProduct,
                        colors: [...(editingProduct.colors || []), ...addedColors]
                      });
                      setNewColor('');
                    }
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingProduct?.colors?.map((color, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                    {color}
                    <button 
                      type="button"
                      onClick={() => {
                        if (editingProduct) {
                          const newColors = [...(editingProduct.colors || [])];
                          newColors.splice(idx, 1);
                          setEditingProduct({ ...editingProduct, colors: newColors });
                        }
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tamanhos</label>
              <div className="flex gap-2 mb-2">
                <input 
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="input" 
                  placeholder="Ex: P, M, G" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSize.trim() && editingProduct) {
                        const addedSizes = newSize.split(',').map(s => s.trim()).filter(s => s !== '');
                        setEditingProduct({
                          ...editingProduct,
                          sizes: [...(editingProduct.sizes || []), ...addedSizes]
                        });
                        setNewSize('');
                      }
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (newSize.trim() && editingProduct) {
                      const addedSizes = newSize.split(',').map(s => s.trim()).filter(s => s !== '');
                      setEditingProduct({
                        ...editingProduct,
                        sizes: [...(editingProduct.sizes || []), ...addedSizes]
                      });
                      setNewSize('');
                    }
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingProduct?.sizes?.map((size, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm">
                    {size}
                    <button 
                      type="button"
                      onClick={() => {
                        if (editingProduct) {
                          const newSizes = [...(editingProduct.sizes || [])];
                          newSizes.splice(idx, 1);
                          setEditingProduct({ ...editingProduct, sizes: newSizes });
                        }
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ficha Técnica / Observações</label>
            <textarea 
              name="technicalSheet" 
              className="input min-h-[100px] py-2" 
              defaultValue={editingProduct?.technicalSheet}
              placeholder="Descreva detalhes técnicos, materiais, aviamentos..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fotos (Máx 2)</label>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1].map((index) => (
                <div key={index} className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center overflow-hidden group">
                  {editingProduct?.photos[index] ? (
                    <>
                      <img src={editingProduct.photos[index]} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          const newPhotos = [...(editingProduct.photos || [])];
                          newPhotos.splice(index, 1);
                          setEditingProduct({ ...editingProduct, photos: newPhotos });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 p-4 text-center">
                      <Image className="text-slate-400" size={24} />
                      <span className="text-[10px] text-slate-500 font-medium">Clique para upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              const currentPhotos = editingProduct?.photos || [];
                              const newPhotos = [...currentPhotos];
                              newPhotos[index] = base64;
                              if (editingProduct) {
                                setEditingProduct({ ...editingProduct, photos: newPhotos });
                              } else {
                                // If creating new, we need a temporary state or just handle it in the form
                                // For simplicity in this demo, I'll use a temporary state if needed, 
                                // but let's assume editingProduct is set even for new (just with empty fields)
                                setEditingProduct({
                                  id: 0,
                                  name: '',
                                  photos: newPhotos,
                                  active: true
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => { setIsProductModalOpen(false); setEditingProduct(null); }} 
              className="flex-1"
            >
              Cancelar
            </Button>
            {editingProduct && editingProduct.id !== 0 && (
              <Button 
                type="button" 
                variant="danger"
                onClick={() => {
                  setIsProductModalOpen(false);
                  deleteProduct(editingProduct);
                }} 
                className="flex-1"
              >
                Excluir
              </Button>
            )}
            <Button type="submit" variant="success" className="flex-1">Salvar Produto</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => setIsEmployeeModalOpen(false)} 
        title={editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
      >
        <form onSubmit={saveEmployee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input name="name" className="input" defaultValue={editingEmployee?.name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
            <input name="role" className="input" defaultValue={editingEmployee?.role} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor da Diária (R$)</label>
            <input name="dailyRate" type="number" step="0.01" className="input" defaultValue={editingEmployee?.dailyRate} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
            <input name="cpf" className="input" defaultValue={editingEmployee?.cpf} placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
            <input name="address" className="input" defaultValue={editingEmployee?.address} placeholder="Rua, Número, Bairro, Cidade - UF" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chave PIX</label>
            <input name="pix_key" className="input" defaultValue={editingEmployee?.pix_key} placeholder="CPF, E-mail, Telefone ou Chave Aleatória" />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsEmployeeModalOpen(false)} className="flex-1">Cancelar</Button>
            {editingEmployee && (
              <Button 
                type="button" 
                variant="danger"
                onClick={() => {
                  deleteEmployee(editingEmployee.id);
                  setIsEmployeeModalOpen(false);
                }} 
                className="flex-1"
              >
                Excluir
              </Button>
            )}
            <Button type="submit" variant="primary" className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isShiftModalOpen} 
        onClose={() => setIsShiftModalOpen(false)} 
        title={editingShift ? "Editar Diária" : "Lançar Diária"}
      >
        <form onSubmit={saveShift} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Funcionário</label>
            <select 
              name="employeeId" 
              className="input" 
              defaultValue={editingShift?.employeeId} 
              required
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === Number(e.target.value));
                if (emp && !editingShift) {
                  const form = e.target.form as HTMLFormElement;
                  const amountInput = form.elements.namedItem('amount') as HTMLInputElement;
                  const isHalfDayInput = form.elements.namedItem('isHalfDay') as HTMLInputElement;
                  const hoursInput = form.elements.namedItem('hoursWorked') as HTMLInputElement;
                  
                  if (amountInput) {
                    if (hoursInput && !hoursInput.value) {
                      hoursInput.value = isHalfDayInput?.checked ? "4" : "8";
                    }
                    let rate = emp.dailyRate;
                    if (hoursInput?.value) {
                      rate = (emp.dailyRate / 8) * Number(hoursInput.value);
                    } else if (isHalfDayInput?.checked) {
                      rate = emp.dailyRate / 2;
                    }
                    amountInput.value = rate.toFixed(2);
                  }
                }
              }}
            >
              <option value="">Selecione...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 py-1">
            <input 
              type="checkbox" 
              name="isHalfDay" 
              id="isHalfDay" 
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              defaultChecked={editingShift?.isHalfDay}
              onChange={(e) => {
                const form = e.target.form as HTMLFormElement;
                const empId = Number((form.elements.namedItem('employeeId') as HTMLSelectElement).value);
                const emp = employees.find(emp => emp.id === empId);
                const amountInput = form.elements.namedItem('amount') as HTMLInputElement;
                const hoursInput = form.elements.namedItem('hoursWorked') as HTMLInputElement;
                
                if (emp && amountInput) {
                  if (e.target.checked) {
                    amountInput.value = (emp.dailyRate / 2).toFixed(2);
                    if (hoursInput) hoursInput.value = "4";
                  } else {
                    amountInput.value = emp.dailyRate.toFixed(2);
                    if (hoursInput) hoursInput.value = "8";
                  }
                }
              }}
            />
            <label htmlFor="isHalfDay" className="text-sm font-medium text-slate-700 cursor-pointer">Meia Diária (50% do valor)</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input 
              name="date" 
              type="date" 
              className="input" 
              defaultValue={editingShift?.date || new Date().toLocaleDateString('en-CA')} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
            <input name="amount" type="number" step="0.01" className="input" defaultValue={editingShift?.amount} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Horas Trabalhadas</label>
            <input 
              name="hoursWorked" 
              type="number" 
              step="0.5" 
              className="input" 
              defaultValue={editingShift?.hoursWorked ?? (!editingShift ? 8 : undefined)} 
              placeholder="Ex: 8.5" 
              onChange={(e) => {
                const form = e.target.form as HTMLFormElement;
                const empId = Number((form.elements.namedItem('employeeId') as HTMLSelectElement).value);
                const emp = employees.find(emp => emp.id === empId);
                const amountInput = form.elements.namedItem('amount') as HTMLInputElement;
                const isHalfDayInput = form.elements.namedItem('isHalfDay') as HTMLInputElement;
                
                if (emp && amountInput && e.target.value) {
                  const hours = Number(e.target.value);
                  const calculatedAmount = (emp.dailyRate / 8) * hours;
                  amountInput.value = calculatedAmount.toFixed(2);
                  
                  if (isHalfDayInput) {
                    isHalfDayInput.checked = hours <= 4;
                  }
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
            <textarea name="notes" className="input" rows={2} defaultValue={editingShift?.notes}></textarea>
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsShiftModalOpen(false)} className="flex-1">Cancelar</Button>
            {editingShift && (
              <Button 
                type="button" 
                variant="danger"
                onClick={() => {
                  deleteShift(editingShift.id);
                  setIsShiftModalOpen(false);
                }} 
                className="flex-1"
              >
                Excluir
              </Button>
            )}
            <Button type="submit" variant="success" className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)} 
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
      >
        <form onSubmit={saveClient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input name="name" className="input" defaultValue={editingClient?.name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input name="email" type="email" className="input" defaultValue={editingClient?.email} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <input name="phone" className="input" defaultValue={editingClient?.phone} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
            <textarea name="address" className="input" rows={2} defaultValue={editingClient?.address}></textarea>
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)} className="flex-1">Cancelar</Button>
            {editingClient && (
              <Button 
                type="button" 
                variant="danger"
                onClick={() => {
                  deleteClient(editingClient.id);
                  setIsClientModalOpen(false);
                }} 
                className="flex-1"
              >
                Excluir
              </Button>
            )}
            <Button type="submit" variant="success" className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isProductionOrderModalOpen} 
        onClose={() => setIsProductionOrderModalOpen(false)} 
        title={editingProductionOrder ? `Editar Ordem #${editingProductionOrder.orderNumber || editingProductionOrder.id}` : "Nova Ordem de Produção"}
      >
        <form ref={productionOrderFormRef} onSubmit={saveProductionOrder} className="space-y-4">
          {editingProductionOrder && editingProductionOrder.orderNumber && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 uppercase">Número da Ordem</span>
              <span className="font-mono font-bold text-indigo-700">#{editingProductionOrder.orderNumber}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input name="description" className="input" defaultValue={editingProductionOrder?.description} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
            <select name="clientId" className="input" defaultValue={editingProductionOrder?.clientId}>
              <option value="">Selecione...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
            <div className="flex gap-2">
              <select 
                className="input flex-1" 
                value={selectedProductIdForOrder || ''}
                onChange={(e) => {
                  const pId = Number(e.target.value);
                  setSelectedProductIdForOrder(pId);
                  setOrderItemColor('');
                  setOrderItemSize('');
                  setOrderItemQuantity(0);
                  setOrderItemSheets('');
                  setOrderItemGrid('');
                  setItemsBreakdown([]);

                  // Auto fill unitPrice on production order if product has productionValue
                  const linkedProduct = products.find(p => p.id === pId);
                  if (linkedProduct && linkedProduct.productionValue && productionOrderFormRef.current) {
                    const unitPriceInput = productionOrderFormRef.current.elements.namedItem('unitPrice') as HTMLInputElement;
                    if (unitPriceInput) {
                      unitPriceInput.value = String(linkedProduct.productionValue);
                      const totalPiecesVal = orderItems.reduce((acc, item) => acc + item.quantity, 0);
                      const totalValueInput = productionOrderFormRef.current.elements.namedItem('totalValue') as HTMLInputElement;
                      if (totalValueInput) {
                        totalValueInput.value = (linkedProduct.productionValue * totalPiecesVal).toFixed(2);
                      }
                    }
                  }
                }}
              >
                <option value="">Selecione um produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adicionar Grade do Produto</p>
              {selectedProductIdForOrder && itemsBreakdown.length > 0 && (
                <button 
                  type="button"
                  onClick={() => {
                    const product = products.find(p => p.id === selectedProductIdForOrder);
                    if (product) {
                      const newItem: OrderItem = {
                        productId: product.id,
                        productName: product.name,
                        quantity: itemsBreakdown.reduce((acc, i) => acc + i.quantity, 0),
                        itemsBreakdown: [...itemsBreakdown],
                        unitPrice: product.productionValue || 0
                      };
                      setOrderItems([...orderItems, newItem]);
                      setItemsBreakdown([]);
                      setSelectedProductIdForOrder(null);
                      setTimeout(updateAutoDescription, 0);
                    }
                  }}
                  className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Adicionar Produto à Ordem
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cor</label>
                <select 
                  className="input text-xs py-1 h-9 w-full" 
                  value={orderItemColor}
                  onChange={(e) => setOrderItemColor(e.target.value)}
                >
                  <option value="">Selecione a cor...</option>
                  {(() => {
                    const product = products.find(p => p.id === selectedProductIdForOrder);
                    return (product?.colors || []).map(c => <option key={c} value={c}>{c}</option>);
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd. de Folhas</label>
                <input 
                  type="number" 
                  min="1"
                  className="input text-xs py-1 h-9 w-full" 
                  value={orderItemSheets || ''}
                  onChange={(e) => setOrderItemSheets(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grade</label>
                <input 
                  type="text" 
                  className="input text-xs py-1 h-9 w-full" 
                  value={orderItemGrid}
                  onChange={(e) => setOrderItemGrid(e.target.value)}
                  placeholder="Ex: 1p 2m 2g 1gg"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qtd. Por Tam.</label>
                <div className="flex gap-1.5 items-center">
                  <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 h-9 text-xs flex items-center text-slate-600 font-mono tracking-tight flex-1 overflow-x-auto whitespace-nowrap">
                    {(() => {
                      if (!orderItemSheets || !orderItemGrid) return <span className="text-slate-400 italic font-sans font-normal">Aguardando...</span>;
                      const parsed = parseOrderItemGrid(orderItemGrid, Number(orderItemSheets));
                      if (parsed.length === 0) return <span className="text-slate-400 italic font-sans font-normal">Formato inválido</span>;
                      return parsed.map(p => `${p.quantity}${p.size.toLowerCase()}`).join(' - ');
                    })()}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (orderItemColor && orderItemSheets && orderItemGrid) {
                        const parsed = parseOrderItemGrid(orderItemGrid, Number(orderItemSheets));
                        if (parsed.length > 0) {
                          let newBreakdown = [...itemsBreakdown];
                          parsed.forEach(p => {
                            const product = products.find(prod => prod.id === selectedProductIdForOrder);
                            let matchedSize = p.size;
                            if (product && product.sizes) {
                              const found = product.sizes.find(s => s.toLowerCase().trim() === p.size.toLowerCase().trim());
                              if (found) matchedSize = found;
                            }
                            
                            const existingIdx = newBreakdown.findIndex(item => 
                              item.color.toLowerCase().trim() === orderItemColor.toLowerCase().trim() && 
                              item.size.toLowerCase().trim() === matchedSize.toLowerCase().trim()
                            );
                            
                            if (existingIdx >= 0) {
                              newBreakdown[existingIdx].quantity += p.quantity;
                            } else {
                              newBreakdown.push({ 
                                color: orderItemColor, 
                                size: matchedSize, 
                                quantity: p.quantity 
                              });
                            }
                          });
                          
                          setItemsBreakdown(newBreakdown);
                          setOrderItemSheets('');
                        }
                      }
                    }}
                    className="bg-indigo-600 text-white p-1.5 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                    title="Adicionar Grade por Cor"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {itemsBreakdown.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                {itemsBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 text-xs">
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          min="0"
                          className="w-14 h-7 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            const newBreakdown = [...itemsBreakdown];
                            newBreakdown[idx] = { ...newBreakdown[idx], quantity: val };
                            setItemsBreakdown(newBreakdown);
                          }}
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase select-none mr-2">pçs</span>
                      </div>
                      <span className="text-slate-600 font-medium">{item.color}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-extrabold text-[10px] text-slate-500">{item.size}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newBreakdown = itemsBreakdown.filter((_, i) => i !== idx);
                        setItemsBreakdown(newBreakdown);
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Remover tamanho"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {orderItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produtos na Ordem</p>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-indigo-600" />
                        <span className="font-bold text-slate-800 text-sm">{item.productName}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold">{item.quantity} pçs</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newItems = orderItems.filter((_, i) => i !== idx);
                          setOrderItems(newItems);
                          setTimeout(updateAutoDescription, 0);
                        }}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.itemsBreakdown.map((b, bIdx) => (
                        <span key={bIdx} className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100">
                          {b.color} / {b.size}: <span className="font-bold text-slate-700">{b.quantity}</span>
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total de Peças</label>
                        <input 
                          type="number" 
                          min="0"
                          className="input text-xs py-1 h-8 w-full font-semibold focus:ring-1 focus:ring-indigo-500"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            const newItems = [...orderItems];
                            newItems[idx] = { ...newItems[idx], quantity: val };
                            setOrderItems(newItems);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Preço Unitário (R$)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          className="input text-xs py-1 h-8 w-full font-semibold focus:ring-1 focus:ring-indigo-500"
                          value={item.unitPrice !== undefined ? item.unitPrice : ''}
                          placeholder="0.00"
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            const newItems = [...orderItems];
                            newItems[idx] = { ...newItems[idx], unitPrice: val };
                            setOrderItems(newItems);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total de Peças</label>
              <input 
                name="totalPieces" 
                type="number" 
                className="input bg-slate-50" 
                value={orderItems.reduce((acc, item) => acc + item.quantity, 0) + itemsBreakdown.reduce((acc, i) => acc + i.quantity, 0)} 
                readOnly 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço Unitário (R$)</label>
              <input 
                name="unitPrice" 
                type="number" 
                step="0.01" 
                className="input" 
                defaultValue={editingProductionOrder?.unitPrice} 
                onChange={(e) => {
                  const form = e.target.form as HTMLFormElement;
                  const totalPieces = Number((form.elements.namedItem('totalPieces') as HTMLInputElement).value);
                  const totalValueInput = form.elements.namedItem('totalValue') as HTMLInputElement;
                  if (totalValueInput) {
                    totalValueInput.value = (Number(e.target.value) * totalPieces).toFixed(2);
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total da Ordem (R$)</label>
            <input name="totalValue" type="number" step="0.01" className="input" defaultValue={editingProductionOrder?.totalValue} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status de Produção</label>
            <select 
              name="status" 
              className="input" 
              defaultValue={editingProductionOrder?.status || 'planning'}
              onChange={updateAutoDescription}
            >
              <option value="planning">Planejamento</option>
              <option value="cutting">Corte</option>
              <option value="sewing">Costura</option>
              <option value="finishing">Acabamento</option>
              <option value="completed">Finalizado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
            <select name="priority" className="input" defaultValue={editingProductionOrder?.priority || 'medium'}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
            <input name="startDate" type="date" className="input" defaultValue={editingProductionOrder?.startDate || new Date().toLocaleDateString('en-CA')} required />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsProductionOrderModalOpen(false)} className="flex-1">Cancelar</Button>
            {editingProductionOrder && (
              <>
                {editingProductionOrder.status !== 'completed' && (
                  <Button 
                    type="button" 
                    variant="success"
                    onClick={() => {
                      setFractionalOrder(editingProductionOrder);
                      setCompletedQuantity(editingProductionOrder.totalPieces);
                      setIsFractionalModalOpen(true);
                      setIsProductionOrderModalOpen(false);
                    }} 
                    className="flex-1"
                  >
                    Finalizar Parcialmente
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="danger"
                  onClick={() => {
                    deleteProductionOrder(editingProductionOrder.id);
                    setIsProductionOrderModalOpen(false);
                  }} 
                  className="flex-1"
                >
                  Excluir
                </Button>
              </>
            )}
            <Button type="submit" variant="success" className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isProductionOrderDetailModalOpen} 
        onClose={() => setIsProductionOrderDetailModalOpen(false)} 
        title="Detalhes da Ordem de Produção"
        maxWidth="max-w-5xl"
      >
        {(() => {
          const order = productionOrders.find(o => o.id === selectedProductionOrderId);
          if (!order) return <p className="text-center py-8 text-slate-400">Ordem não encontrada.</p>;
          const stats = getOrderStats(order.id);
          const hasFinance = transactions.some(t => t.relatedId === order.id && t.category === 'Venda de Produção');
          
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-end mb-4">
                <button 
                  onClick={() => setIsProductionStepModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> Lançar Produção
                </button>
                {order.status === 'completed' && !hasFinance && (
                  <button 
                    onClick={() => { setPendingFinanceOrder(order); setIsOrderFinanceModalOpen(true); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <DollarSign size={16} /> Lançar Financeiro
                  </button>
                )}
                <button 
                  onClick={() => { 
                    setEditingProductionOrder(order); 
                    setOrderItems((order.items || []).map(item => ({
                      ...item,
                      unitPrice: item.unitPrice !== undefined ? item.unitPrice : (order.unitPrice || 0)
                    })));
                    setItemsBreakdown([]);
                    setSelectedProductIdForOrder(null);
                    setOrderItemColor('');
                    setOrderItemSheets('');
                    setOrderItemGrid('');
                    setIsProductionOrderModalOpen(true); 
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button 
                  onClick={() => exportIndividualProductionOrderPDF(order)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <FileText size={16} /> PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status Atual</p>
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
                        Avançar <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total de Peças</p>
                  <p className="text-lg font-bold text-slate-800">{order.totalPieces}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cliente</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{clients.find(c => c.id === order.clientId)?.name || '-'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Data Início</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(order.startDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Package size={18} className="text-indigo-600" /> Rastreamento por Etapa
                    </h3>
                    
                    <div className="space-y-6">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produtos e Grades</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package size={16} className="text-indigo-600" />
                                  <span className="font-bold text-slate-800">{item.productName}</span>
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">{item.quantity} pçs</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {item.itemsBreakdown.map((b, bIdx) => (
                                  <div key={bIdx} className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate w-full">{b.color}</p>
                                    <p className="text-xs font-medium text-slate-700">{b.size}</p>
                                    <p className="text-xs font-bold text-indigo-600">{b.quantity} pçs</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 text-slate-400 italic">Nenhum produto vinculado.</p>
                      )}
                      {[
                        { label: 'Corte', count: stats.cutting, color: 'bg-blue-500' },
                        { label: 'Costura', count: stats.sewing, color: 'bg-indigo-500' },
                        { label: 'Acabamento', count: stats.finishing, color: 'bg-emerald-500' }
                      ].map(stage => (
                        <div key={stage.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-700">{stage.label}</span>
                            <span className="text-xs font-bold text-slate-500">
                              {stage.count} / {order.totalPieces} <span className="text-[10px] ml-1">({Math.round((stage.count / order.totalPieces) * 100)}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 text-sm">Histórico Recente</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Data</th>
                            <th className="px-4 py-3 font-semibold">Funcionário</th>
                            <th className="px-4 py-3 font-semibold text-right">Qtd</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {productionSteps.filter(s => s.orderId === order.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(step => (
                            <tr key={step.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-slate-500">{formatDate(step.date)}</td>
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {step.employeeName}
                                <span className="block text-[9px] text-slate-400 uppercase font-bold">{step.stepType}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-indigo-600">{step.quantity}</td>
                            </tr>
                          ))}
                          {productionSteps.filter(s => s.orderId === order.id).length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Nenhum lançamento.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                      <Users size={16} className="text-indigo-600" /> Recursos Alocados
                    </h3>
                    <div className="space-y-3">
                      {stats.allocatedEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-[10px]">
                              {emp.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{emp.name}</p>
                              <p className="text-[9px] text-slate-400 uppercase">{emp.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-indigo-600">{emp.totalProduced} pçs</p>
                          </div>
                        </div>
                      ))}
                      {stats.allocatedEmployees.length === 0 && (
                        <p className="text-center py-2 text-slate-400 text-xs italic">Nenhum funcionário alocado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal 
        isOpen={isTransactionDetailModalOpen} 
        onClose={() => setIsTransactionDetailModalOpen(false)} 
        title="Detalhes da Transação Financeira"
        maxWidth="max-w-3xl"
      >
        {(() => {
          const transaction = transactions.find(t => t.id === selectedTransactionId);
          if (!transaction) return <p className="text-center py-8 text-slate-400">Transação não encontrada.</p>;
          
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-end mb-4">
                <button 
                  onClick={() => generateFinancialTransactionReport(transaction)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <FileText size={16} /> Comprovante PDF
                </button>
                <button 
                  onClick={() => { 
                    setEditingTransaction(transaction); 
                    setIsFinanceModalOpen(true); 
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Edit2 size={16} /> Editar
                </button>
                {transaction.status !== 'pending' && (
                  <button 
                    onClick={() => reverseTransaction(transaction)}
                    className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <RotateCcw size={16} /> Estornar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Valor Total</p>
                  <p className={`text-xl font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    transaction.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                    transaction.status === 'partial' ? 'bg-indigo-100 text-indigo-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {transaction.status === 'completed' ? 'Efetivado' : transaction.status === 'partial' ? 'Parcial' : 'Pendente'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Data do Lançamento</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(transaction.date)}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informações Gerais</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Descrição</p>
                        <p className="text-sm font-medium text-slate-700">{transaction.description}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Categoria</p>
                        <p className="text-sm font-medium text-slate-700">{transaction.category}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Cliente/Fornecedor</p>
                        <p className="text-sm font-medium text-slate-700">{transaction.clientName || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalhes de Pagamento</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Vencimento</p>
                        <p className="text-sm font-medium text-slate-700">{transaction.dueDate ? formatDate(transaction.dueDate) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Data de Efetivação</p>
                        <p className="text-sm font-medium text-slate-700">{transaction.finishedDate ? formatDate(transaction.finishedDate) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Pago</p>
                        <p className="text-sm font-bold text-emerald-600">R$ {(transaction.paidAmount || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Saldo Restante</p>
                        <p className="text-sm font-bold text-red-600">R$ {(transaction.amount - (transaction.paidAmount || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Conciliação Bancária</p>
                      <div className="flex items-center gap-2 mt-1">
                        {transaction.reconciled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 size={14} /> Conciliado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs">
                            <Clock size={14} /> Não Conciliado
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleReconciliation(transaction)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${transaction.reconciled ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'}`}
                    >
                      {transaction.reconciled ? 'Desfazer Conciliação' : 'Conciliar Agora'}
                    </button>
                  </div>
                </div>

                {transaction.notes && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Observações</p>
                    <p className="text-sm text-slate-600 italic leading-relaxed">{transaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal 
        isOpen={isRepairDetailModalOpen} 
        onClose={() => setIsRepairDetailModalOpen(false)} 
        title="Detalhes do Concerto"
        maxWidth="max-w-3xl"
      >
        {(() => {
          const repair = repairs.find(r => r.id === selectedRepairId);
          if (!repair) return <p className="text-center py-8 text-slate-400">Concerto não encontrado.</p>;
          const product = products.find(p => p.id === repair.productId);
          
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-end mb-4">
                <button 
                  onClick={() => { 
                    setEditingRepair(repair); 
                    setSelectedProductIdForRepair(repair.productId);
                    setRepairItemsBreakdown(repair.itemsBreakdown || []);
                    setIsRepairModalOpen(true); 
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Edit2 size={16} /> Editar
                </button>
                <button 
                  onClick={() => deleteRepair(repair.id)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Tipo</p>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    repair.type === 'entry' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {repair.type === 'entry' ? 'Entrada (Para Concerto)' : 'Saída (Consertado)'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Quantidade</p>
                  <p className="text-lg font-bold text-slate-800">{repair.quantity}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Data</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(repair.date)}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Produto</p>
                  <p className="text-sm font-bold text-slate-800">{product?.name || 'Produto não encontrado'}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{product?.sku || '-'}</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Detalhes da Peça</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase truncate w-full">Cor</p>
                      <p className="text-xs font-bold text-indigo-600">{repair.color}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase truncate w-full">Tamanho</p>
                      <p className="text-xs font-bold text-indigo-600">{repair.size}</p>
                    </div>
                  </div>
                </div>

                {repair.notes && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Observações</p>
                    <p className="text-sm text-slate-600 italic leading-relaxed">{repair.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal 
        isOpen={isShiftDetailModalOpen} 
        onClose={() => setIsShiftDetailModalOpen(false)} 
        title="Detalhes das Diárias"
        maxWidth="max-w-4xl"
      >
        {(() => {
          const item = getReportData().find(i => i.id === selectedEmployeeIdForShifts);
          if (!item) return <p className="text-center py-8 text-slate-400">Dados não encontrados.</p>;
          
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-end mb-4">
                <button 
                  onClick={() => exportEmployeeGroupedPDF(item.name, item.shifts)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center gap-2 text-sm"
                >
                  <FileDown size={16} /> Exportar PDF
                </button>
                {item.shifts.some(s => s.status === 'pending') && (
                  <button 
                    onClick={async () => {
                      const pendingIds = item.shifts.filter(s => s.status === 'pending').map(s => s.id);
                      if (pendingIds.length > 0) {
                        setSelectedShifts(pendingIds);
                        setIsGroupedFinanceModalOpen(true);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 size={16} /> Baixar Pendentes
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total de Diárias</p>
                  <p className="text-lg font-bold text-slate-800">{item.totalShifts}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total de Horas</p>
                  <p className="text-lg font-bold text-slate-800">{item.totalHours}h</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Valor Total</p>
                  <p className="text-lg font-bold text-indigo-600">R$ {item.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Lista de Diárias - {item.name}</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Data</th>
                        <th className="px-4 py-3 font-semibold">Horas Trabalhadas</th>
                        <th className="px-4 py-3 font-semibold">Valor</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {item.shifts.map(shift => (
                        <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500">{formatDate(shift.date)}</td>
                          <td className="px-4 py-3 text-slate-600 font-bold">{shift.hoursWorked || '-'}h</td>
                          <td className="px-4 py-3 text-slate-800 font-bold">R$ {shift.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              shift.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {shift.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal 
        isOpen={isRepairModalOpen} 
        onClose={() => setIsRepairModalOpen(false)} 
        title="Cadastro de Peças para Concerto"
      >
        <form onSubmit={saveRepair} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
            <select 
              name="productId" 
              className="input" 
              required
              onChange={(e) => {
                const pId = Number(e.target.value);
                setSelectedProductIdForRepair(pId);
                setRepairItemColor('');
                setRepairItemSize('');
                setRepairItemQuantity(0);
                setRepairItemsBreakdown([]);
              }}
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select name="type" className="input" required>
                <option value="entry">Entrada (Para Concerto)</option>
                <option value="exit">Saída (Consertado)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grade de Peças</p>
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cor</label>
                <select 
                  className="input text-sm px-1 h-9" 
                  value={repairItemColor}
                  onChange={(e) => setRepairItemColor(e.target.value)}
                >
                  <option value="">Cor...</option>
                  {(() => {
                    const product = products.find(p => p.id === selectedProductIdForRepair);
                    return (product?.colors || []).map(c => <option key={c} value={c}>{c}</option>);
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tam.</label>
                <select 
                  className="input text-sm px-1 h-9" 
                  value={repairItemSize}
                  onChange={(e) => setRepairItemSize(e.target.value)}
                >
                  <option value="">Tam...</option>
                  {(() => {
                    const product = products.find(p => p.id === selectedProductIdForRepair);
                    return (product?.sizes || []).map(s => <option key={s} value={s}>{s}</option>);
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qtd.</label>
                <div className="flex gap-1">
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="input text-sm px-1 h-9 flex-1 min-w-0" 
                    placeholder="0"
                    value={repairItemQuantity || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setRepairItemQuantity(val ? Number(val) : 0);
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (!repairItemColor || !repairItemSize || !repairItemQuantity) {
                        setError('Selecione cor, tamanho e quantidade.');
                        return;
                      }
                      const existingIdx = repairItemsBreakdown.findIndex(i => i.color === repairItemColor && i.size === repairItemSize);
                      let newBreakdown = [...repairItemsBreakdown];
                      if (existingIdx >= 0) {
                        newBreakdown[existingIdx].quantity += repairItemQuantity;
                      } else {
                        newBreakdown.push({ color: repairItemColor, size: repairItemSize, quantity: repairItemQuantity });
                      }
                      setRepairItemsBreakdown(newBreakdown);
                      setRepairItemQuantity(0);
                    }}
                    className="h-9 px-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {repairItemsBreakdown.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                {repairItemsBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-sm font-medium text-slate-700">{item.color} / {item.size}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600">{item.quantity} un</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const newBreakdown = repairItemsBreakdown.filter((_, i) => i !== idx);
                          setRepairItemsBreakdown(newBreakdown);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center px-2 pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                  <span className="font-black text-slate-800">{repairItemsBreakdown.reduce((acc, curr) => acc + curr.quantity, 0)} un</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input name="date" type="date" className="input" defaultValue={new Date().toLocaleDateString('en-CA')} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
            <textarea name="notes" className="input h-20" placeholder="Motivo do concerto, etc..."></textarea>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsRepairModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isProductionStepModalOpen} 
        onClose={() => setIsProductionStepModalOpen(false)} 
        title="Lançar Produção Diária"
      >
        <form onSubmit={saveProductionStep} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ordem de Produção</label>
            <select name="orderId" className="input" defaultValue={selectedProductionOrderId || ''} required>
              <option value="">Selecione...</option>
              {productionOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber ? `#${o.orderNumber} - ` : ''}{o.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quem Produziu</label>
            <select name="employeeId" className="input" required>
              <option value="">Selecione...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Etapa</label>
            <select name="stepType" className="input" required>
              <option value="cutting">Corte</option>
              <option value="sewing">Costura</option>
              <option value="finishing">Acabamento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Peças</label>
            <input name="quantity" type="number" className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input name="date" type="date" className="input" defaultValue={new Date().toLocaleDateString('en-CA')} required />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsProductionStepModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isFinanceModalOpen} 
        onClose={() => { setIsFinanceModalOpen(false); setEditingTransaction(null); }} 
        title={editingTransaction ? "Editar Transação" : "Nova Transação Financeira"}
      >
        <form onSubmit={saveTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select name="type" className="input" defaultValue={editingTransaction?.type || 'expense'} required>
                <option value="income">Entrada (Receita)</option>
                <option value="expense">Saída (Despesa)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" className="input" defaultValue={editingTransaction?.status || 'completed'} required>
                <option value="completed">Efetivado (Pago/Recebido)</option>
                <option value="pending">Pendente (A Pagar/Receber)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input name="description" className="input" defaultValue={editingTransaction?.description} required />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">cliente/funcionário</label>
            <input 
              name="clientName" 
              className="input" 
              value={financeClientSearch}
              onChange={(e) => {
                setFinanceClientSearch(e.target.value);
                setShowFinanceClientDropdown(true);
              }}
              onFocus={() => setShowFinanceClientDropdown(true)}
              onBlur={() => setTimeout(() => setShowFinanceClientDropdown(false), 200)}
              placeholder="Nome do cliente ou funcionário"
              autoComplete="off"
            />
            <AnimatePresence>
              {showFinanceClientDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                >
                  {filteredFinanceClients.length > 0 ? (
                    filteredFinanceClients.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex justify-between items-center"
                        onClick={() => {
                          setFinanceClientSearch(item.name);
                          setShowFinanceClientDropdown(false);
                        }}
                      >
                        <span className="text-sm text-slate-700">{item.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-slate-500 italic">Nenhum resultado encontrado</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <input name="category" className="input" defaultValue={editingTransaction?.category} placeholder="Ex: Venda, Compra de Tecido, Aluguel" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
              <input name="amount" type="text" className="input" defaultValue={editingTransaction?.amount} placeholder="0,00" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Lançamento</label>
              <input name="date" type="date" className="input" defaultValue={editingTransaction?.date || new Date().toLocaleDateString('en-CA')} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Vencimento (Opcional)</label>
            <input name="dueDate" type="date" className="input" defaultValue={editingTransaction?.dueDate || ''} />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="reconciled_check" 
              id="reconciled_check" 
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              defaultChecked={editingTransaction?.reconciled}
              onChange={(e) => {
                const form = e.target.form as HTMLFormElement;
                const hiddenInput = form.elements.namedItem('reconciled') as HTMLInputElement;
                if (hiddenInput) hiddenInput.value = e.target.checked ? 'true' : 'false';
              }}
            />
            <input type="hidden" name="reconciled" value={editingTransaction?.reconciled ? 'true' : 'false'} />
            <label htmlFor="reconciled_check" className="text-sm font-medium text-slate-700 cursor-pointer">Conciliado com o Banco</label>
          </div>

          {!editingTransaction && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="isRecurring_check" 
                  id="isRecurring_check" 
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  checked={isRecurring}
                  onChange={(e) => {
                    setIsRecurring(e.target.checked);
                    const form = e.target.form as HTMLFormElement;
                    const hiddenInput = form.elements.namedItem('isRecurring') as HTMLInputElement;
                    if (hiddenInput) hiddenInput.value = e.target.checked ? 'true' : 'false';
                  }}
                />
                <input type="hidden" name="isRecurring" value={isRecurring ? 'true' : 'false'} />
                <label htmlFor="isRecurring_check" className="text-sm font-bold text-slate-700 cursor-pointer">Transação Recorrente (Fixa)</label>
              </div>

              {isRecurring && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-3 pt-2"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Frequência</label>
                    <select name="recurrencePeriod" className="input text-sm py-1.5 h-auto">
                      <option value="monthly">Mensal</option>
                      <option value="weekly">Semanal</option>
                      <option value="daily">Diária</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Repetir (vezes)</label>
                    <input name="recurrenceCount" type="number" min="2" max="60" defaultValue="12" className="input text-sm py-1.5 h-auto" />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => { setIsFinanceModalOpen(false); setEditingTransaction(null); }} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Salvar</button>
          </div>
          {editingTransaction && (
            <button 
              type="button" 
              onClick={() => { deleteTransaction(editingTransaction.id); setIsFinanceModalOpen(false); }}
              className="w-full text-red-500 text-sm font-medium hover:underline mt-2"
            >
              Excluir Transação
            </button>
          )}
        </form>
      </Modal>

      <Modal 
        isOpen={isFractionalModalOpen} 
        onClose={() => { setIsFractionalModalOpen(false); setFractionalOrder(null); }} 
        title="Finalizar Produção Fracionada"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Ordem Original</p>
            <p className="font-bold text-slate-800">{fractionalOrder?.description}</p>
            <p className="text-sm text-slate-600">Total de peças: <span className="font-bold">{fractionalOrder?.totalPieces}</span></p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Quantidade a Finalizar Agora
            </label>
            <input 
              type="number" 
              value={completedQuantity} 
              onChange={(e) => setCompletedQuantity(Number(e.target.value))}
              max={fractionalOrder?.totalPieces}
              min={1}
              className="input text-lg font-bold"
            />
            <div className="flex gap-2 mt-2">
              <button 
                type="button"
                onClick={() => setCompletedQuantity(fractionalOrder?.totalPieces || 0)}
                className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 uppercase tracking-wider"
              >
                Finalizar Tudo
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              O restante ({Math.max(0, (fractionalOrder?.totalPieces || 0) - completedQuantity)} peças) gerará uma nova ordem de produção.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => { setIsFractionalModalOpen(false); setFractionalOrder(null); }}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button 
              onClick={completeFractionalOrder}
              className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Finalizar
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isOrderFinanceModalOpen} 
        onClose={() => { setIsOrderFinanceModalOpen(false); setPendingFinanceOrder(null); }} 
        title="Lançamento Financeiro"
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-indigo-700 font-medium mb-1">Ordem Finalizada:</p>
            <p className="font-bold text-indigo-900">
              {pendingFinanceOrder?.orderNumber ? `#${pendingFinanceOrder.orderNumber} - ` : ''}
              {pendingFinanceOrder?.description}
            </p>
            <p className="text-xl font-black text-indigo-600 mt-2">R$ {pendingFinanceOrder?.totalValue?.toFixed(2)}</p>
          </div>
          <p className="text-slate-600 text-sm">Deseja lançar este valor no sistema financeiro agora?</p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => launchFinanceFromOrder('pending')}
              className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl transition-all group"
            >
              <Clock className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-amber-900 font-bold text-sm">Pendente</span>
              <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">A Receber</span>
            </button>
            <button 
              onClick={() => launchFinanceFromOrder('completed')}
              className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-all group"
            >
              <CheckCircle2 className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
              <span className="text-emerald-900 font-bold text-sm">Pago</span>
              <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Efetivado</span>
            </button>
          </div>
          <button 
            onClick={() => { setIsOrderFinanceModalOpen(false); setPendingFinanceOrder(null); }}
            className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
          >
            Não lançar agora
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isGroupedFinanceModalOpen} 
        onClose={() => setIsGroupedFinanceModalOpen(false)} 
        title="Lançamento Agrupado"
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-700 font-medium mb-1">Total a Lançar:</p>
            <p className="text-2xl font-black text-emerald-900">
              R$ {shifts.filter(s => selectedShifts.includes(s.id)).reduce((acc, s) => acc + Number(s.amount), 0).toFixed(2)}
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              {selectedShifts.length} diárias selecionadas
            </p>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {Object.values(
              shifts.filter(s => selectedShifts.includes(s.id))
                .reduce((acc: any, s) => {
                  if (!acc[s.employeeId]) {
                    const emp = employees.find(e => e.id === s.employeeId);
                    acc[s.employeeId] = { name: emp?.name || 'Funcionário', amount: 0, count: 0, pendingCount: 0 };
                  }
                  acc[s.employeeId].amount += Number(s.amount);
                  acc[s.employeeId].count += 1;
                  if (s.status === 'pending') acc[s.employeeId].pendingCount += 1;
                  return acc;
                }, {})
            ).map((group: any, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-bold text-slate-800">{group.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    {group.count} diárias {group.pendingCount < group.count && `(${group.pendingCount} pendentes)`}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-700">R$ {group.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <p className="text-slate-500 text-sm italic">
            Será criado um lançamento financeiro para cada funcionário no valor total de suas diárias selecionadas.
          </p>

          <div className="pt-4 flex gap-3">
            <button 
              onClick={() => setIsGroupedFinanceModalOpen(false)} 
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button 
              onClick={processBulkPayShifts}
              className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar Lançamento
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBatchFinanceModalOpen}
        onClose={() => { setIsBatchFinanceModalOpen(false); setSelectedTransactions([]); setBatchTotalAmount(''); setBatchPaymentAmounts({}); }}
        title={financeTab === 'payable' ? 'Pagamento em Lote' : 'Recebimento em Lote'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <label className="block text-sm font-bold text-indigo-900 mb-2">
              Valor Total a {financeTab === 'payable' ? 'Pagar' : 'Receber'} (Abatimento Automático)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">R$</span>
              <input 
                type="number"
                step="0.01"
                value={batchTotalAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setBatchTotalAmount(val);
                  if (val !== '') {
                    distributeBatchAmount(parseFloat(val));
                  }
                }}
                placeholder="Digite o valor total para distribuir..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-indigo-200 rounded-xl text-lg font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
            <p className="text-[10px] text-indigo-600 font-bold uppercase mt-2 tracking-wider">
              O valor será distribuído automaticamente entre as contas selecionadas.
            </p>
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2">
            {transactions
              .filter(t => selectedTransactions.includes(t.id))
              .sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date))
              .map(t => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(t.dueDate || t.date)}</p>
                      <p className="text-sm font-semibold text-slate-800">{t.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Atual</p>
                      <p className="text-sm font-bold text-slate-700">R$ {(t.amount - (t.paidAmount || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Valor a {financeTab === 'payable' ? 'Pagar' : 'Receber'}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          value={batchPaymentAmounts[t.id] || ''}
                          onChange={(e) => setBatchPaymentAmounts(prev => ({ ...prev, [t.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="text-right pb-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Novo Saldo Restante</p>
                      <p className={`text-base font-black ${(t.amount - (t.paidAmount || 0) - (batchPaymentAmounts[t.id] || 0)) < -0.01 ? 'text-red-500' : 'text-emerald-600'}`}>
                        R$ {(t.amount - (t.paidAmount || 0) - (batchPaymentAmounts[t.id] || 0)).toFixed(2)}
                      </p>
                      {(t.amount - (t.paidAmount || 0) - (batchPaymentAmounts[t.id] || 0)) < -0.01 && (
                        <p className="text-[9px] text-red-400 font-bold uppercase mt-0.5">Valor excede o saldo</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-900">Total Selecionado:</span>
              <span className="text-lg font-bold text-indigo-900">
                R$ {(Object.values(batchPaymentAmounts) as number[]).reduce((acc: number, val: number) => acc + val, 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => { setIsBatchFinanceModalOpen(false); setSelectedTransactions([]); setBatchTotalAmount(''); setBatchPaymentAmounts({}); }} 
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={generateBatchFinanceReport}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <FileDown size={18} />
              Relatório
            </button>
            <button 
              onClick={async () => {
                for (const id of selectedTransactions) {
                  const t = transactions.find(trans => trans.id === id);
                  const amount = batchPaymentAmounts[id];
                  if (t && amount > 0) {
                    await updateTransactionStatus(t, 'partial', amount);
                  }
                }
                setIsBatchFinanceModalOpen(false);
                setSelectedTransactions([]);
                setBatchPaymentAmounts({});
                setBatchTotalAmount('');
              }}
              className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar {financeTab === 'payable' ? 'Pagamentos' : 'Recebimentos'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isDefectModalOpen} 
        onClose={() => setIsDefectModalOpen(false)} 
        title="Lançar Defeito"
      >
        <form onSubmit={addDefect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ordem de Produção (Opcional)</label>
            <select name="orderId" className="input">
              <option value="">Selecione a OP...</option>
              {productionOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber ? `#${o.orderNumber} - ` : ''}{o.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Lançamento</label>
            <select name="type" className="input" required>
              <option value="entry">Entrada (Peça com Defeito)</option>
              <option value="exit">Saída (Peça Recuperada/Descartada)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
              <input name="quantity" type="number" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
              <input name="date" type="date" className="input" defaultValue={new Date().toLocaleDateString('en-CA')} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Observação</label>
            <textarea name="reason" className="input min-h-[80px]" placeholder="Descreva o defeito ou motivo da saída..."></textarea>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsDefectModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">Salvar Lançamento</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Resetar Sistema">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <p className="text-sm text-red-800">
              <strong>ATENÇÃO:</strong> Esta ação é irreversível. Todos os dados de funcionários, diárias, produção, parceiros e financeiro serão apagados permanentemente.
            </p>
          </div>
          <p className="text-slate-600 text-sm">Para confirmar, digite <strong>RESETAR</strong> abaixo:</p>
          <input 
            type="text" 
            className="input" 
            placeholder="Digite RESETAR" 
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
          />
          <div className="flex gap-3 pt-4">
            <button onClick={() => setIsResetModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button 
              onClick={handleReset} 
              disabled={resetConfirmText !== 'RESETAR'}
              className="btn-primary flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resetar Tudo
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAction?.onConfirm || (() => {})}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText}
        confirmColor={confirmAction?.confirmColor}
      />

      {success && (
        <div className="fixed bottom-4 right-4 z-[60] bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={20} />
          <span className="font-medium">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 z-[60] bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <AlertTriangle size={20} />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError('')} className="ml-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
