export interface Employee {
  id: number;
  name: string;
  role: string;
  dailyRate: number;
  active: boolean;
  cpf?: string;
  address?: string;
  pix_key?: string;
}

export interface DailyShift {
  id: number;
  employeeId: number;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
  notes?: string;
  isHalfDay?: boolean;
  hoursWorked?: number;
}

export interface User {
  id: number;
  username: string;
  role?: string;
  hasBiometrics?: boolean;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  category?: string;
  technicalSheet?: string;
  photos: string[];
  colors?: string[];
  sizes?: string[];
  active: boolean;
  productionValue?: number;
}

export interface OrderItem {
  productId: number;
  productName?: string;
  quantity: number;
  itemsBreakdown: { color: string, size: string, quantity: number }[];
  unitPrice?: number;
}

export interface ProductionOrder {
  id: number;
  orderNumber?: string;
  description: string;
  clientId?: number;
  clientName?: string;
  items: OrderItem[];
  totalPieces: number;
  unitPrice?: number;
  totalValue?: number;
  status: 'planning' | 'cutting' | 'sewing' | 'finishing' | 'completed';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate?: string;
}

export interface ProductionStep {
  id: number;
  orderId: number;
  employeeId: number;
  employeeName?: string;
  stepType: 'cutting' | 'sewing' | 'finishing';
  quantity: number;
  date: string;
}

export interface FinancialTransaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  paidAmount: number;
  date: string;
  description: string;
  relatedId?: number;
  clientName?: string;
  status: 'pending' | 'partial' | 'completed';
  dueDate?: string;
  finishedDate?: string;
  reconciled: boolean;
  isRecurring?: boolean;
  recurrencePeriod?: 'monthly' | 'weekly' | 'daily';
  recurrenceCount?: number;
}

export type Transaction = FinancialTransaction;

export interface Defect {
  id: number;
  orderId?: number;
  orderNumber?: string;
  orderDescription?: string;
  type: 'entry' | 'exit';
  quantity: number;
  reason?: string;
  date: string;
}

export interface Repair {
  id: number;
  productId: number;
  productName?: string;
  type: 'entry' | 'exit';
  quantity: number;
  color: string;
  size: string;
  date: string;
  notes?: string;
}

export interface CompanySettings {
  id: number;
  name: string;
  document_type?: 'CPF' | 'CNPJ';
  document_number?: string;
  state_registration?: string;
  rg?: string;
  address?: string;
  city?: string;
  logo_url?: string;
  pdf_background_color?: string;
}
