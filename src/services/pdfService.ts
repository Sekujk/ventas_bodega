/**
 * Servicio para generar PDFs profesionales
 * Usa jsPDF en lugar de construir PDF manualmente
 */

// Tipos para la información que necesitamos
export interface ClienteDeudaInfo {
  nombre: string;
  telefono?: string;
  url: string;
}

export interface DeudaInfo {
  producto: string;
  precio: number;
  fecha: string;
}

export interface PdfDeudaData {
  cliente: ClienteDeudaInfo;
  totalDeuda: number;
  totalPagado: number;
  saldo: number;
  deudas: DeudaInfo[];
}

/**
 * Formatea moneda al formato colombiano
 */
const formatMoney = (value: number): string => {
  return `S/ ${value.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
};

/**
 * Genera un PDF de estado de deuda y retorna un Blob
 * Retorna Promise porque es async (simulando carga)
 */
export async function generateDebtPdf(data: PdfDeudaData): Promise<Blob> {
  // Importar jsPDF dinámicamente
  const { jsPDF } = await import('jspdf');
  // const { autoTable } = await import('jspdf-autotable');

  const pdf = new jsPDF();

  // Configuración de colores
  const primaryColor = [51, 51, 51]; // Gris oscuro
  const lightBg = [240, 240, 240]; // Gris claro
  const successColor = [34, 139, 34]; // Verde
  const dangerColor = [220, 53, 69]; // Rojo

  let yPosition = 15;

  // ========== HEADER ==========
  pdf.setFillColor(200, 200, 200);
  pdf.rect(10, 10, 190, 25, 'F');

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('ESTADO DE DEUDA', 15, 25);

  // ========== INFORMACIÓN DEL CLIENTE ==========
  yPosition = 40;
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text(data.cliente.nombre, 15, yPosition);

  yPosition += 8;
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  if (data.cliente.telefono) {
    pdf.text(`Teléfono: ${data.cliente.telefono}`, 15, yPosition);
    yPosition += 6;
  }
  pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 15, yPosition);

  // ========== RESUMEN FINANCIERO ==========
  yPosition += 15;

  // Helper para dibujar caja de resumen
  const drawSummaryBox = (label: string, amount: string, y: number, bgColor: number[]) => {
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(15, y, 60, 15, 'F');

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.text(label, 18, y + 5);

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(amount, 18, y + 11);
  };

  drawSummaryBox('TOTAL CONSUMIDO', formatMoney(data.totalDeuda), yPosition, [230, 230, 230]);
  drawSummaryBox('TOTAL PAGADO', formatMoney(data.totalPagado), yPosition + 18, [200, 255, 200]);

  // Saldo (color dinámico)
  const saldoColor = data.saldo <= 0 ? [200, 255, 200] : [255, 200, 200];
  drawSummaryBox('SALDO', formatMoney(Math.abs(data.saldo)), yPosition + 36, saldoColor);

  // ========== TABLA DE DEUDAS ==========
  yPosition += 60;

  const tableData = data.deudas.slice(0, 20).map((deuda) => [
    deuda.producto.substring(0, 40),
    formatMoney(deuda.precio),
    deuda.fecha,
  ]);

  // Tabla manual en lugar de autoTable
  yPosition += 12;
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(51, 51, 51);
  pdf.text('Producto', 15, yPosition);
  pdf.text('Valor', 120, yPosition);
  pdf.text('Fecha', 160, yPosition);
  
  yPosition += 6;
  data.deudas.forEach((deuda) => {
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.text(deuda.producto, 15, yPosition);
    pdf.text(formatMoney(deuda.precio), 120, yPosition, { align: 'right' });
    pdf.text(deuda.fecha, 160, yPosition, { align: 'right' });
    yPosition += 6;
  });

  // ========== NOTA SI HAY MÁS DEUDAS ==========
  if (data.deudas.length > 20) {
    pdf.setFont('Helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `... y ${data.deudas.length - 20} deudas más`,
      15,
      yPosition + 5
    );
  }

  // ========== FOOTER ==========
  const pageCount = (pdf as any).getNumberOfPages?.();
  const lastY = 270;

  pdf.setFillColor(240, 240, 240);
  pdf.rect(10, lastY, 190, 20, 'F');

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('INFORMACIÓN DE CONTACTO', 15, lastY + 6);

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text(data.cliente.telefono || 'Sin teléfono registrado', 15, lastY + 12);

  // Número de página
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`Página 1 de 1`, 180, lastY + 12, { align: 'right' });

  // Convertir a Blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

/**
 * Descarga el PDF generado
 */
export async function downloadDebtPdf(
  data: PdfDeudaData,
  filename: string = 'deuda.pdf'
): Promise<void> {
  const blob = await generateDebtPdf(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Comparte el PDF por Web Share API (móvil) o descarga (escritorio)
 */
export async function shareDebtPdf(
  data: PdfDeudaData,
  filename: string = 'deuda.pdf'
): Promise<void> {
  const blob = await generateDebtPdf(data);
  const file = new File([blob], filename, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: `Deuda de ${data.cliente.nombre}`,
      text: `Estado de deuda de ${data.cliente.nombre}`,
      files: [file],
    });
  } else {
    // Fallback a descarga
    await downloadDebtPdf(data, filename);
  }
}
