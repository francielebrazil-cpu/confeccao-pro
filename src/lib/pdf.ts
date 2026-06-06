import jsPDF from 'jspdf';
import { CompanySettings } from '../types';

export const addPDFHeader = (doc: jsPDF, title: string, companySettings?: CompanySettings) => {
  // Background color if set
  if (companySettings?.pdf_background_color) {
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

  const logoToUse = companySettings?.logo_url || "/icone.png";

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
  doc.text(companySettings?.name || 'Confecção Pro', 35, 25);

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

export const drawDefaultLogo = (doc: jsPDF, pink: number[], purple: number[]) => {
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

export const savePDF = (
  doc: jsPDF, 
  fileName: string, 
  setSuccess?: (msg: string) => void, 
  setError?: (msg: string) => void
) => {
  try {
    // Tenta o método padrão de download
    doc.save(fileName);
    if (setSuccess) setSuccess('Download do PDF iniciado! Verifique sua pasta de downloads.');
  } catch (err) {
    console.error('Erro ao salvar PDF:', err);
    try {
      // Fallback 1: tenta usar um link oculto (mais compatível com alguns navegadores móveis)
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (setSuccess) setSuccess('Download do PDF iniciado via link alternativo.');
    } catch (err2) {
      try {
        // Fallback 2: tenta abrir em uma nova aba (funciona melhor em alguns WebViews/APKs)
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        if (setSuccess) setSuccess('PDF aberto em nova aba. Você pode salvá-lo a partir daí.');
      } catch (err3) {
        if (setError) setError('Não foi possível baixar o PDF. Tente usar um navegador padrão como Chrome ou Safari.');
      }
    }
  }
};
