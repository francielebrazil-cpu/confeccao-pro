import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ProductionOrder, 
  Repair, 
  FinancialTransaction, 
  Client, 
  Product, 
  Employee, 
  ProductionStep,
  CompanySettings
} from '../types';
import { addPDFHeader, savePDF } from './pdf';
import { formatDate } from './utils';

export const exportProductionOrderReportPDF = (
  orders: ProductionOrder[], 
  type: 'detailed' | 'grouped',
  startDate: string,
  endDate: string,
  setSuccess?: (msg: string) => void,
  setError?: (msg: string) => void
) => {
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
      (o.items || []).flatMap(item => item.itemsBreakdown).map(i => `${i.color}/${i.size}: ${i.quantity}`).join('\n'),
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

  savePDF(doc, `relatorio-producao-${type}-${new Date().getTime()}.pdf`, setSuccess, setError);
};

export const exportRepairReportPDF = (
  repairsList: Repair[],
  startDate: string,
  endDate: string,
  companySettings: CompanySettings,
  setSuccess?: (msg: string) => void,
  setError?: (msg: string) => void
) => {
  const doc = new jsPDF();
  const startY = addPDFHeader(doc, 'Relatório de Concertos (Entrada e Saída)', companySettings);
  
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

  savePDF(doc, `relatorio-concertos-${new Date().getTime()}.pdf`, setSuccess, setError);
};

export const exportIndividualProductionOrderPDF = (
  order: ProductionOrder,
  clients: Client[],
  products: Product[],
  employees: Employee[],
  productionSteps: ProductionStep[],
  transactions: FinancialTransaction[],
  companySettings: CompanySettings,
  statusLabels: Record<string, string>,
  setSuccess?: (msg: string) => void,
  setError?: (msg: string) => void
) => {
  const doc = new jsPDF();
  const steps = productionSteps.filter(s => s.orderId === order.id);
  const orderTransactions = transactions.filter(t => t.relatedId === order.id && t.category === 'Venda de Produção');

  const startY = addPDFHeader(doc, `Ordem de Produção #${order.orderNumber || order.id}`, companySettings);
  
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
    ['Status:', statusLabels[order.status] || order.status],
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
    doc.text('Grade de Peças (Cores e Tamanhos)', 14, currentY);
    
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

  savePDF(doc, `ordem-producao-${order.orderNumber || order.id}-${new Date().getTime()}.pdf`, setSuccess, setError);
};

export const generateFinancialTransactionReport = (
  transaction: FinancialTransaction,
  productionOrders: ProductionOrder[],
  setSuccess?: (msg: string) => void,
  setError?: (msg: string) => void
) => {
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

  savePDF(doc, `comprovante-${transaction.id}-${new Date().getTime()}.pdf`, setSuccess, setError);
};

export const generateFinanceListReport = (
  type: 'income' | 'expense',
  transactions: FinancialTransaction[],
  productionOrders: ProductionOrder[],
  setSuccess?: (msg: string) => void,
  setError?: (msg: string) => void
) => {
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
    head: [['Descrição', 'cliente/funcionário', 'Categoria', 'Data', 'Total', 'Pago', 'Status']],
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

  savePDF(doc, `relatorio-financeiro-${type}-${new Date().getTime()}.pdf`, setSuccess, setError);
};

export const exportBulkIndividualProductionOrderPDF = (
  orders: ProductionOrder[],
  clients: Client[],
  products: Product[],
  employees: Employee[],
  productionSteps: ProductionStep[],
  transactions: FinancialTransaction[],
  companySettings: CompanySettings,
  statusLabels: Record<string, string>,
  setSuccess?: (msg: string) => void,
  setError?: (msg: string) => void
) => {
  if (!orders || orders.length === 0) return;
  const doc = new jsPDF();
  
  orders.forEach((order, index) => {
    if (index > 0) doc.addPage();
    
    const steps = productionSteps.filter(s => s.orderId === order.id);
    const orderTransactions = transactions.filter(t => t.relatedId === order.id && t.category === 'Venda de Produção');

    const startY = addPDFHeader(doc, `Ficha de Ordem de Produção #${order.orderNumber || order.id}`, companySettings);
    
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
      ['Status:', statusLabels[order.status] || order.status],
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
    }
  });

  savePDF(doc, `fichas-individuais-producao-${new Date().getTime()}.pdf`, setSuccess, setError);
};
