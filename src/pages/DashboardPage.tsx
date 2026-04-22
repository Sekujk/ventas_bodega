import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useVentasDelDia } from "@/hooks/useVentas";
import { useClients } from "@/hooks/useClients";
import { ventasService } from "@/services/ventasService";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SugerenciaProducto {
  nombre: string;
  precio_sugerido?: number | null;
}

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: ventas, isLoading, refetch } = useVentasDelDia();
  const { data: clientes } = useClients();

  const [clienteId, setClienteId] = useState<string>("");
  const [producto, setProducto] = useState("");
  const [precio, setPrecio] = useState("");
  const [loadingProducto, setLoadingProducto] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<SugerenciaProducto[]>([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [bloquearSugerencias, setBloquearSugerencias] = useState(false);

  const totalDia = ventas?.reduce((sum, v) => sum + v.precio, 0) || 0;
  const ventasCount = ventas?.length || 0;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAgregarProducto = async () => {
    if (!clienteId || clienteId.trim() === "") {
      setErrorMsg("Selecciona un cliente");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (!producto || producto.trim() === "") {
      setErrorMsg("Escribe un producto");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (!precio || precio.trim() === "") {
      setErrorMsg("Escribe el precio");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorMsg("Precio debe ser mayor a 0");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setLoadingProducto(true);
    setErrorMsg(null);
    try {
      await ventasService.createVenta(
        clienteId,
        producto.toLowerCase().trim(),
        precioNum
      );
      setSuccessMsg("✅ Producto agregado");
      setProducto("");
      setPrecio("");
      setTimeout(() => {
        setSuccessMsg(null);
        refetch();
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error detallado:", err);
      setErrorMsg(errorMsg);
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoadingProducto(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarSugerencias = async () => {
      if (bloquearSugerencias || !clienteId || producto.trim().length < 2) {
        setSugerencias([]);
        return;
      }

      setLoadingSugerencias(true);
      try {
        const data = await ventasService.getProductSuggestions(producto.trim());
        if (activo) setSugerencias(data || []);
      } catch {
        if (activo) setSugerencias([]);
      } finally {
        if (activo) setLoadingSugerencias(false);
      }
    };

    const timer = window.setTimeout(cargarSugerencias, 40);
    return () => {
      activo = false;
      window.clearTimeout(timer);
    };
  }, [clienteId, producto, bloquearSugerencias]);

  const handleEliminarDeuda = async (ventaId: string) => {
    if (!window.confirm("¿Eliminar esta deuda?")) return;
    setDeletingId(ventaId);
    try {
      await ventasService.deleteVenta(ventaId);
      setSuccessMsg("✅ Deuda eliminada");
      setTimeout(() => {
        setSuccessMsg(null);
        refetch();
      }, 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al eliminar");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const clientesFiltrados = clientes?.filter((c) =>
    c.nombre.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const clienteSeleccionado = clientes?.find((c) => c.id === clienteId);
  
  // Productos del cliente seleccionado (últimos agregados)
  const productosCliente = ventas?.filter((v) => v.cliente_id === clienteId) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Compacto */}
      <div className="bg-white border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deudas</h1>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded font-semibold"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 py-4">
        {/* FORM PRINCIPAL - AMPLIADO */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">📝 Agregar a Deuda</h2>

          {/* Cliente CON BÚSQUEDA */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-900 mb-3">
              🔍 Cliente
            </label>
              <input
                type="text"
                value={searchCliente}
                onChange={(e) => {
                  setSearchCliente(e.target.value);
                setClienteId("");
              }}
              placeholder="Escribe nombre del cliente..."
              className="w-full px-3 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
              disabled={clienteSeleccionado ? true : false}
            />

            {/* Dropdown clientes */}
            {searchCliente && clientesFiltrados && clientesFiltrados.length > 0 && !clienteSeleccionado ? (
              <div className="border-2 border-gray-400 rounded bg-white shadow max-h-48 overflow-y-auto mt-2">
                {clientesFiltrados.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClienteId(c.id);
                      setSearchCliente("");
                    }}
                    className="w-full text-left px-3 py-2 border-b border-gray-200 hover:bg-gray-100 text-lg font-semibold text-gray-900"
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            ) : null}

            {clienteSeleccionado && (
              <div className="mt-3 p-4 bg-green-50 border-2 border-green-400 rounded">
                <p className="text-xl font-bold text-green-900">✓ {clienteSeleccionado.nombre}</p>
                <button
                  onClick={() => {
                    setClienteId("");
                    setSearchCliente("");
                    setProducto("");
                    setPrecio("");
                  }}
                  className="w-full mt-3 bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 px-3 rounded text-xl"
                >
                  CAMBIAR CLIENTE
                </button>
              </div>
            )}
          </div>

          {clienteSeleccionado && (
            <>
              {/* Agregar Productos */}
              <div className="mb-4 p-4 bg-gray-50 border-2 border-gray-300 rounded">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">💰 Agregar Producto</h3>

                <div className="mb-3">
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Producto
                  </label>
                  <input
                    value={producto}
                    onChange={(e) => {
                      setProducto(e.target.value);
                      setBloquearSugerencias(false);
                    }}
                    type="text"
                    placeholder="Ej: gaseosa, pan..."
                    className="w-full px-4 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
                  />
                  {loadingSugerencias && producto.trim().length >= 2 && (
                    <p className="text-xs text-gray-500 mt-1">Buscando sugerencias...</p>
                  )}
                  {sugerencias.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {sugerencias.map((sugerencia) => (
                        <button
                          key={`${sugerencia.nombre}-${sugerencia.precio_sugerido ?? "x"}`}
                          onClick={() => {
                            setBloquearSugerencias(true);
                            setProducto(sugerencia.nombre);
                            if (sugerencia.precio_sugerido != null) {
                              setPrecio(String(sugerencia.precio_sugerido));
                            }
                            setSugerencias([]);
                          }}
                          className="w-full text-left px-3 py-2 bg-white border-2 border-gray-300 rounded text-sm font-semibold text-gray-900"
                        >
                          <span className="block capitalize">{sugerencia.nombre}</span>
                          {sugerencia.precio_sugerido != null && (
                            <span className="block text-xs text-gray-600">
                              Precio sugerido: ${sugerencia.precio_sugerido.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Precio
                  </label>
                  <input
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2 bg-red-50 border-2 border-red-400 rounded mb-3">
                    <p className="text-base text-red-900 font-bold">{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="p-2 bg-green-50 border-2 border-green-400 rounded mb-3">
                    <p className="text-base text-green-900 font-bold">{successMsg}</p>
                  </div>
                )}

                <button
                  onClick={handleAgregarProducto}
                  disabled={!producto || !precio || loadingProducto}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-3 rounded text-xl"
                >
                  {loadingProducto ? "Agregando..." : "✓ AGREGAR"}
                </button>
              </div>

              {/* Deudas del Cliente */}
              {productosCliente.length > 0 && (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Deudas del cliente ({productosCliente.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {productosCliente.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex justify-between items-center p-3 bg-white rounded border-2 border-gray-300"
                      >
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900 capitalize">
                            {prod.producto}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(prod.created_at).toLocaleTimeString("es-CO")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900 mb-2">
                            ${prod.precio.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                          </p>
                          <button
                            onClick={() => handleEliminarDeuda(prod.id)}
                            disabled={deletingId === prod.id}
                            className="text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 px-3 rounded"
                          >
                            {deletingId === prod.id ? "Borrando..." : "Borrar"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ÚLTIMAS DEUDAS DEL DÍA (SIN CLIENTE SELECCIONADO) */}
        {!clienteSeleccionado && ventas && ventas.length > 0 && (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Deudas Recientes</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ventas.slice(0, 8).map((venta) => {
                const cliente = clientes?.find((c) => c.id === venta.cliente_id);
                return (
                  <div
                    key={venta.id}
                    className="flex justify-between items-start p-2 bg-gray-50 rounded border border-gray-300"
                  >
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900 capitalize">
                        {venta.producto}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cliente?.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(venta.created_at).toLocaleTimeString("es-CO")}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 ml-2">
                      ${venta.precio.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTÓN CLIENTES */}
        <button
          onClick={() => navigate("/clientes")}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded text-xl transition-all border-2 border-gray-900"
        >
          Clientes
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
