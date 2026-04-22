import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useVentas } from "@/hooks/useVentas";
import { clientesService } from "@/services/clientesService";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ClientsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { data: clientes, isLoading, refetch } = useClients();
  const { data: ventas } = useVentas();
  const navigate = useNavigate();

  const handleCreateCliente = async () => {
    if (!nombre.trim()) {
      setErrorMsg("Ingresa nombre del cliente");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setLoading(true);
    try {
      await clientesService.createCliente(nombre, telefono);
      setNombre("");
      setTelefono("");
      setShowForm(false);
      setErrorMsg(null);
      refetch();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const calcularDeuda = (clienteId: string) => {
    const deudas = ventas?.filter((v) => v.cliente_id === clienteId) || [];
    return deudas.reduce((sum, v) => sum + v.precio, 0);
  };

  const copiarEnlaceDeuda = async (token: string, clienteId: string) => {
    const url = `${window.location.origin}/deuda/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(clienteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-4 py-3 rounded border border-gray-300 mb-3 shadow-sm"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-600">
            {clientes?.length || 0} cliente{(clientes?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 py-4">
        {/* New Client Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded text-lg mb-6"
          >
            Nuevo Cliente
          </button>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuevo Cliente</h2>

            <div className="mb-4">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Nombre
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                type="text"
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
              />
            </div>

            <div className="mb-4">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Teléfono (Opcional)
              </label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  type="tel"
                  placeholder="Ej: 3001234567"
                  className="w-full px-3 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
                />
              </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border-2 border-red-400 rounded mb-4">
                <p className="text-lg text-red-900 font-bold">{errorMsg}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreateCliente}
                disabled={loading || !nombre.trim()}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded text-lg"
              >
                {loading ? "Guardando..." : "GUARDAR"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNombre("");
                  setTelefono("");
                  setErrorMsg(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-4 rounded text-lg"
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {/* Clients List */}
        {clientes && clientes.length > 0 ? (
          <div className="space-y-3">
            {clientes.map((cliente) => {
              const deuda = calcularDeuda(cliente.id);
              return (
                <div
                  key={cliente.id}
                  className="w-full bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm"
                >
                  <p className="text-lg font-bold text-gray-900">{cliente.nombre}</p>
                  {cliente.telefono && (
                    <p className="text-sm text-gray-600">📞 {cliente.telefono}</p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Deuda:</p>
                    <p className={`text-lg font-bold ${deuda > 0 ? "text-red-600" : "text-green-600"}`}>
                      ${deuda.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/cliente/${cliente.id}`)}
                    className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded text-lg"
                  >
                    Ver deuda
                  </button>
                  <button
                    onClick={() => copiarEnlaceDeuda(cliente.token_acceso, cliente.id)}
                    className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-4 rounded text-lg"
                  >
                    {copiedId === cliente.id ? "Enlace copiado" : "Copiar enlace"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-8 text-center shadow-sm">
            <p className="text-xl text-gray-600 mb-2">Sin clientes</p>
            <p className="text-sm text-gray-500">
              Crea un nuevo cliente para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
