import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useVentas } from "@/hooks/useVentas";
import { usePagosByCliente } from "@/hooks/usePagos";
import { ventasService } from "@/services/ventasService";
import { pagosService } from "@/services/pagosService";
import { getErrorMessage } from "@/services/errorHandler";
import { useNotification } from "@/hooks/useNotification";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: clientes, isLoading } = useClients();
  const { data: ventas, refetch: refetchVentas } = useVentas();
  const { data: pagos, refetch: refetchPagos } = usePagosByCliente(id || "");

  const [montoPago, setMontoPago] = useState("");
  const [loadingPago, setLoadingPago] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const montoPagoRef = useRef<HTMLInputElement>(null);
  const { notification, error, success } = useNotification();

  if (isLoading) return <LoadingSpinner />;

  const cliente = clientes?.find((c) => c.id === id);
  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-2xl mx-auto px-3 py-4">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 text-center">
            <p className="text-xl text-gray-600">Cliente no encontrado</p>
            <button
              onClick={() => navigate("/clientes")}
              className="mt-4 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded border border-gray-300"
            >
              Volver a Clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar deudas y pagos del cliente
  const deudas = ventas?.filter((v) => v.cliente_id === id) || [];
  const pagosDatos = pagos || [];

  // Calcular totales
  const totalDeuda = deudas.reduce((sum, v) => sum + v.precio, 0);
  const totalPagado = pagosDatos.reduce((sum, p) => sum + p.monto, 0);
  const saldo = totalDeuda - totalPagado;

  // Handlers
  const handleEliminarDeuda = async (ventaId: string) => {
    if (!window.confirm("¿Eliminar esta deuda?")) return;

    setDeletingId(ventaId);
    try {
      await ventasService.deleteVenta(ventaId);
      success("✅ Deuda eliminada");
      refetchVentas();
    } catch (err) {
      error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegistrarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      error("Ingresa un monto válido");
      return;
    }

    if (parseFloat(montoPago) > saldo) {
      error(`No puede pagar más que la deuda ($${saldo.toLocaleString("es-CO", { maximumFractionDigits: 0 })})`);
      return;
    }

    setLoadingPago(true);
    try {
      await pagosService.createPago(id!, parseFloat(montoPago));
      success("✅ Pago registrado");
      setMontoPago("");
      refetchPagos();
      refetchVentas();
    } catch (err) {
      error(getErrorMessage(err));
    } finally {
      setLoadingPago(false);
    }
  };

  const irAPagar = () => {
    montoPagoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    montoPagoRef.current?.focus();
  };

  const publicUrl = `${window.location.origin}/deuda/${cliente.token_acceso}`;

  const handleWhatsApp = () => {
    if (!cliente.telefono) {
      window.alert("Este cliente no tiene número registrado.");
      return;
    }

    const telefono = cliente.telefono.replace(/\D/g, "");
    if (!telefono) {
      window.alert("Este cliente no tiene un número válido registrado.");
      return;
    }

    const mensaje = `Hola ${cliente.nombre}, te escribo por tu deuda. ${publicUrl}`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toAscii = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "");

  const escapePdfText = (value: string) =>
    toAscii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  const buildDebtPdfBlob = () => {
    const money = (value: number) => `$${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
    
    let streamContent = "";
    
    streamContent += "q\n0.85 0.85 0.85 rg\n0 700 612 75 re\nf\n";
    streamContent += "Q\n";
    
    streamContent += "BT\n";
    streamContent += "/F1 18 Tf\n";
    streamContent += "50 750 Td\n";
    streamContent += "(ESTADO DE DEUDA) Tj\n";
    streamContent += "ET\n";
    
    streamContent += "BT\n";
    streamContent += "/F1 14 Tf\n";
    streamContent += "50 725 Td\n";
    streamContent += `(${escapePdfText(cliente.nombre)}) Tj\n`;
    streamContent += "ET\n";
    
    streamContent += "BT\n";
    streamContent += "/F1 10 Tf\n";
    streamContent += "50 710 Td\n";
    streamContent += `(Fecha: ${new Date().toLocaleDateString("es-CO")}) Tj\n`;
    streamContent += "ET\n";
    
    streamContent += "q\n0.5 0.5 0.5 RG\n1 w\n";
    streamContent += "50 695 m\n562 695 l\nS\nQ\n";
    
    let yPos = 670;
    
    streamContent += "q\n0.9 0.9 0.9 rg\n50 " + (yPos - 20) + " 150 25 re\nf\nQ\n";
    streamContent += "BT\n/F1 10 Tf\n50 " + (yPos - 5) + " Td\n(TOTAL CONSUMIDO) Tj\nET\n";
    streamContent += "BT\n/F1 12 Tf\n200 " + (yPos - 5) + " Td\n(" + escapePdfText(money(totalDeuda)) + ") Tj\nET\n";
    
    yPos -= 40;
    
    streamContent += "q\n0.95 0.98 0.95 rg\n50 " + (yPos - 20) + " 150 25 re\nf\nQ\n";
    streamContent += "BT\n/F1 10 Tf\n50 " + (yPos - 5) + " Td\n(TOTAL PAGADO) Tj\nET\n";
    streamContent += "BT\n/F1 12 Tf\n200 " + (yPos - 5) + " Td\n(" + escapePdfText(money(totalPagado)) + ") Tj\nET\n";
    
    yPos -= 40;
    
    const saldoColor = saldo <= 0 ? "0.85 0.98 0.85" : "0.98 0.85 0.85";
    streamContent += "q\n" + saldoColor + " rg\n50 " + (yPos - 20) + " 150 25 re\nf\nQ\n";
    streamContent += "BT\n/F1 11 Tf\n50 " + (yPos - 5) + " Td\n(SALDO) Tj\nET\n";
    streamContent += "BT\n/F1 13 Tf\n200 " + (yPos - 5) + " Td\n(" + escapePdfText(money(Math.abs(saldo))) + ") Tj\nET\n";
    
    yPos -= 50;
    
    streamContent += "q\n0.5 0.5 0.5 RG\n1 w\n";
    streamContent += "50 " + yPos + " m\n562 " + yPos + " l\nS\nQ\n";
    
    yPos -= 25;
    
    streamContent += "BT\n/F1 12 Tf\n50 " + yPos + " Td\n(DEUDAS REGISTRADAS) Tj\nET\n";
    
    yPos -= 20;
    
    streamContent += "q\n0.8 0.8 0.8 rg\n50 " + (yPos - 15) + " 512 15 re\nf\nQ\n";
    streamContent += "BT\n/F1 9 Tf\n55 " + (yPos - 10) + " Td\n(PRODUCTO) Tj\n200 0 Td\n(VALOR) Tj\n100 0 Td\n(FECHA) Tj\nET\n";
    
    yPos -= 25;
    
    for (let i = 0; i < Math.min(deudas.length, 15); i++) {
      if (yPos < 50) break;
      const deuda = deudas[i];
      streamContent += "BT\n/F1 8 Tf\n55 " + yPos + " Td\n(" + escapePdfText(deuda.producto.substring(0, 30)) + ") Tj\n";
      streamContent += "200 0 Td\n(" + escapePdfText(money(deuda.precio)) + ") Tj\n";
      streamContent += "100 0 Td\n(" + escapePdfText(new Date(deuda.created_at).toLocaleDateString("es-CO")) + ") Tj\nET\n";
      yPos -= 15;
    }
    
    if (deudas.length > 15) {
      streamContent += "BT\n/F1 8 Tf\n55 " + yPos + " Td\n(... y " + escapePdfText((deudas.length - 15).toString()) + " deudas mas) Tj\nET\n";
    }
    
    yPos -= 30;
    
    streamContent += "q\n0.9 0.9 0.9 rg\n0 0 612 " + (Math.abs(yPos) + 20) + " re\nf\nQ\n";
    streamContent += "BT\n/F1 9 Tf\n50 " + (yPos - 10) + " Td\n(INFORMACION DE CONTACTO) Tj\nET\n";
    streamContent += "BT\n/F1 8 Tf\n50 " + (yPos - 25) + " Td\n(" + escapePdfText(cliente.telefono || "Sin teléfono") + ") Tj\nET\n";
    streamContent += "BT\n/F1 8 Tf\n50 " + (yPos - 40) + " Td\n(URL Publica: " + escapePdfText(publicUrl.substring(0, 50)) + "...) Tj\nET\n";

    const obj1 = "<< /Type /Catalog /Pages 2 0 R >>";
    const obj2 = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
    const obj3 = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
    const obj4 = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    const obj5Stream = `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`;

    const objects = [obj1, obj2, obj3, obj4, obj5Stream];
    
    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    
    objects.forEach((obj, idx) => {
      const objStr = `${idx + 1} 0 obj\n${obj}\nendobj\n`;
      offsets.push(pdf.length);
      pdf += objStr;
    });

    const xrefOffset = pdf.length;
    pdf += "xref\n";
    pdf += `0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.forEach((offset) => {
      pdf += String(offset).padStart(10, "0") + " 00000 n \n";
    });

    pdf += "trailer\n";
    pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += "startxref\n";
    pdf += xrefOffset + "\n";
    pdf += "%%EOF\n";

    return new Blob([pdf], { type: "application/pdf" });
  };

  const downloadDebtPdf = () => {
    const blob = buildDebtPdfBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deuda-${toAscii(cliente.nombre).toLowerCase().replace(/\s+/g, "-") || "cliente"}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareDebtPdf = async () => {
    const blob = buildDebtPdfBlob();
    const file = new File([blob], `deuda-${toAscii(cliente.nombre).toLowerCase().replace(/\s+/g, "-") || "cliente"}.pdf`, {
      type: "application/pdf",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `Deuda de ${cliente.nombre}`,
        text: `Adjunto PDF con la deuda de ${cliente.nombre}.`,
        files: [file],
      });
      return;
    }

    downloadDebtPdf();
    window.alert("Tu navegador no permite enviar el PDF directamente. Se descargó el archivo.");
  };

  const handleSharePdf = async () => {
    setDownloadingPdf(true);
    try {
      await shareDebtPdf();
      success("PDF compartido correctamente");
    } catch (err) {
      error("Error al compartir el PDF");
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-4 py-3 rounded border border-gray-300 mb-3 shadow-sm"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{cliente.nombre}</h1>
          {cliente.telefono && (
            <p className="text-sm text-gray-600">📞 {cliente.telefono}</p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={shareDebtPdf}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded text-lg"
            >
              WhatsApp
            </button>
            <button
              onClick={downloadDebtPdf}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-4 px-4 rounded text-lg"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 py-4">
        {/* SALDO */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-gray-100 rounded p-3 border border-gray-300">
              <p className="text-xs text-gray-600 font-semibold">Debe</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalDeuda.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-gray-100 rounded p-3 border border-gray-300">
              <p className="text-xs text-gray-600 font-semibold">Pagó</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalPagado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={`rounded p-3 border-2 ${saldo <= 0 ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"}`}>
              <p className="text-xs font-semibold">Saldo</p>
              <p className={`text-xl font-bold ${saldo <= 0 ? "text-green-900" : "text-red-900"}`}>
                ${Math.abs(saldo).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* REGISTRO PAGO */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registrar Pago</h2>

          <div className="mb-4">
            <label className="block text-lg font-bold text-gray-900 mb-2">
              Monto a Pagar
            </label>
            <input
              ref={montoPagoRef}
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              type="number"
              placeholder="0"
              className="w-full px-3 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
              disabled={saldo <= 0}
            />
            <p className="text-xs text-gray-500 mt-1">Máximo: ${saldo.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</p>
          </div>

          {notification && (
            <div className={`p-3 border-2 rounded mb-4 ${
              notification.type === 'error'
                ? 'bg-red-50 border-red-400'
                : 'bg-green-50 border-green-400'
            }`}>
              <p className={`text-lg font-bold ${
                notification.type === 'error'
                  ? 'text-red-900'
                  : 'text-green-900'
              }`}>
                {notification.message}
              </p>
            </div>
          )}

          <button
            onClick={handleRegistrarPago}
            disabled={loadingPago || saldo <= 0 || !montoPago}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded text-lg"
          >
            {loadingPago ? "Registrando..." : "REGISTRAR PAGO"}
          </button>
        </div>

        {/* DEUDAS */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Deudas del cliente ({deudas.length})
          </h2>

          {deudas.length > 0 ? (
            <div className="space-y-2">
              {deudas.map((deuda) => (
                <div
                  key={deuda.id}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-300"
                >
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 capitalize">
                      {deuda.producto}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(deuda.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">
                      ${deuda.precio.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </p>
                    <button
                      onClick={() => handleEliminarDeuda(deuda.id)}
                      disabled={deletingId === deuda.id}
                      className="text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-3 rounded"
                    >
                      {deletingId === deuda.id ? "Borrando..." : "Borrar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">Sin deudas</p>
          )}
        </div>

        {/* PAGOS */}
        {pagosDatos.length > 0 && (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pagos Realizados ({pagosDatos.length})
            </h2>
            <div className="space-y-2">
              {pagosDatos.map((pago) => (
                <div
                  key={pago.id}
                  className="flex justify-between items-start p-3 bg-green-50 rounded border border-green-300"
                >
                  <div>
                    <p className="text-sm text-gray-600">
                      {new Date(pago.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    +${pago.monto.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
