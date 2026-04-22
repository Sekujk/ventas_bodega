import React, { useEffect, useRef, useState } from "react";
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

interface ProductoRapido {
  nombre: string;
  precio?: number | null;
}

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: ventas, isLoading, refetch } = useVentasDelDia();
  const { data: clientes } = useClients();

  const [clienteId, setClienteId] = useState<string>("");
  const [searchCliente, setSearchCliente] = useState("");
  const [draftProducto, setDraftProducto] = useState("");
  const [draftPrecio, setDraftPrecio] = useState("");
  const [savingVenta, setSavingVenta] = useState(false);
  const [loadingRapidos, setLoadingRapidos] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sugerencias, setSugerencias] = useState<SugerenciaProducto[]>([]);
  const [productosRapidos, setProductosRapidos] = useState<ProductoRapido[]>([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [bloquearSugerencias, setBloquearSugerencias] = useState(false);
  const productoInputRef = useRef<HTMLInputElement>(null);
  const precioInputRef = useRef<HTMLInputElement>(null);

  const LIMITE_PRODUCTOS_RAPIDOS = 6;
  const totalDia = ventas?.reduce((sum, v) => sum + v.precio, 0) || 0;
  const ventasCount = ventas?.length || 0;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const showError = (message: string) => {
    setErrorMsg(message);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const showSuccess = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 1200);
  };

  const clearDraft = () => {
    setDraftProducto("");
    setDraftPrecio("");
    setSugerencias([]);
    setBloquearSugerencias(false);
    productoInputRef.current?.focus();
  };

  const buildDraftItem = () => {
    if (!clienteId || clienteId.trim() === "") {
      showError("Selecciona un cliente");
      return null;
    }

    if (!draftProducto.trim()) {
      showError("Escribe un producto");
      return null;
    }

    if (!draftPrecio.trim()) {
      showError("Escribe el precio");
      return null;
    }

    const precioNum = parseFloat(draftPrecio);
    if (isNaN(precioNum) || precioNum <= 0) {
      showError("Precio debe ser mayor a 0");
      return null;
    }

    return {
      producto: draftProducto.toLowerCase().trim(),
      precio: precioNum,
    };
  };

  const guardarProductoDirecto = async (producto: string, precio: number) => {
    setErrorMsg(null);
    await ventasService.createVenta(clienteId, producto, precio);
    setProductosRapidos((actuales) => {
      const nombreNormalizado = producto.trim().toLowerCase();
      const sinDuplicado = actuales.filter((item) => item.nombre.trim().toLowerCase() !== nombreNormalizado);
      return [{ nombre: producto, precio }, ...sinDuplicado].slice(0, LIMITE_PRODUCTOS_RAPIDOS);
    });
    showSuccess(`✅ ${producto} guardado`);
    setTimeout(() => refetch(), 500);
  };

  const handleGuardarProducto = async () => {
    const item = buildDraftItem();
    if (!item) return;

    setSavingVenta(true);
    setErrorMsg(null);
    try {
      await guardarProductoDirecto(item.producto, item.precio);
      clearDraft();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError(message);
    } finally {
      setSavingVenta(false);
    }
  };

  const handleChangeClient = () => {
    setClienteId("");
    setSearchCliente("");
    clearDraft();
  };

  const handleSeleccionarRapido = (item: ProductoRapido) => {
    setDraftProducto(item.nombre);
    setDraftPrecio(item.precio != null ? String(item.precio) : "");
    setBloquearSugerencias(true);
    precioInputRef.current?.focus();
  };

  const handleEliminarDeuda = async (ventaId: string) => {
    if (!window.confirm("¿Eliminar esta deuda?")) return;
    setDeletingId(ventaId);
    try {
      await ventasService.deleteVenta(ventaId);
      showSuccess("✅ Deuda eliminada");
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      showError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeleccionarSugerencia = (sugerencia: SugerenciaProducto) => {
    setBloquearSugerencias(true);
    setDraftProducto(sugerencia.nombre);
    if (sugerencia.precio_sugerido != null) {
      setDraftPrecio(String(sugerencia.precio_sugerido));
      precioInputRef.current?.focus();
    } else {
      productoInputRef.current?.focus();
    }
    setSugerencias([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const targetName = (event.currentTarget as HTMLInputElement).name;
      if (targetName === "producto") {
        precioInputRef.current?.focus();
        return;
      }
      handleGuardarProducto();
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarSugerencias = async () => {
      if (bloquearSugerencias || !clienteId || draftProducto.trim().length < 2) {
        setSugerencias([]);
        return;
      }

      setLoadingSugerencias(true);
      try {
        const data = await ventasService.getProductSuggestions(draftProducto.trim());
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
  }, [clienteId, draftProducto, bloquearSugerencias]);

  useEffect(() => {
    if (!clienteId) {
      setProductosRapidos([]);
      return;
    }

    let activo = true;
    const cargarProductosComunes = async () => {
      setLoadingRapidos(true);
      try {
        // Prefix vacio: trae los productos mas comunes del historial.
        const comunes = await ventasService.getProductSuggestions("");
        if (!activo) return;
        const rapidos = (comunes || []).slice(0, LIMITE_PRODUCTOS_RAPIDOS).map((p) => ({
          nombre: p.nombre,
          precio: p.precio_sugerido,
        }));
        setProductosRapidos(rapidos);
      } catch {
        if (activo) setProductosRapidos([]);
      } finally {
        if (activo) setLoadingRapidos(false);
      }
    };

    cargarProductosComunes();
    return () => {
      activo = false;
    };
  }, [clienteId]);

  if (isLoading) return <LoadingSpinner />;

  const clientesFiltrados = clientes?.filter((c) =>
    c.nombre.toLowerCase().includes(searchCliente.toLowerCase())
  );
  const clienteSeleccionado = clientes?.find((c) => c.id === clienteId);
  const productosCliente = ventas?.filter((v) => v.cliente_id === clienteId) || [];

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deudas</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded font-semibold"
            >
              Salir
            </button>
          </div>
          <div className="flex gap-2 text-sm text-gray-700">
            <span className="px-3 py-1 bg-gray-100 rounded">Hoy: {ventasCount}</span>
            <span className="px-3 py-1 bg-gray-100 rounded">
              Total: S/ {totalDia.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4">
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Agregar deuda</h2>
          <p className="text-base font-semibold text-gray-700 mb-6">
            Paso a paso: 1) Elige cliente, 2) Escribe producto y precio, 3) Guarda.
          </p>

          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-900 mb-3">1) Cliente</label>
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setSearchCliente("");
              }}
              className="w-full px-3 py-4 border-2 border-gray-400 rounded text-xl font-semibold focus:outline-none focus:border-gray-600 mb-3"
            >
              <option value="">Selecciona un cliente...</option>
              {(clientes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {!clienteSeleccionado && (
              <>
                <label className="block text-base font-bold text-gray-800 mb-2">
                  O buscar cliente por nombre
                </label>
                <input
                  type="text"
                  value={searchCliente}
                  onChange={(e) => {
                    setSearchCliente(e.target.value);
                    setClienteId("");
                  }}
                  placeholder="Buscar cliente..."
                  className="w-full px-3 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
                />

                {searchCliente && clientesFiltrados && clientesFiltrados.length > 0 && (
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
                )}
              </>
            )}

            {clienteSeleccionado && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-300 rounded">
                <p className="text-xl font-bold text-gray-900">Cliente: {clienteSeleccionado.nombre}</p>
                <button
                  onClick={handleChangeClient}
                  className="w-full mt-3 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-3 rounded text-lg"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </div>

          {clienteSeleccionado && (
            <>
              <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">2) Producto y precio</h3>
                <p className="text-base text-gray-700 mb-4">
                  Escribe el producto, presiona Enter para pasar al precio, y luego Enter para guardar.
                </p>

                {productosRapidos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-lg font-bold text-gray-900 mb-1">Carga rápida (un toque)</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Se muestran los {LIMITE_PRODUCTOS_RAPIDOS} productos mas comunes. Al tocar uno, se
                      rellena producto y precio para editar si cambia.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {productosRapidos.map((item) => {
                        const key = `${item.nombre}-${item.precio}`;
                        return (
                          <button
                            key={key}
                            onClick={() => handleSeleccionarRapido(item)}
                            disabled={savingVenta}
                            className="text-left px-3 py-3 bg-white border border-gray-300 rounded text-base font-bold text-gray-900 hover:bg-gray-100 disabled:bg-gray-100"
                          >
                            <span className="block capitalize">{item.nombre}</span>
                            <span className="block text-sm text-gray-700">
                              {item.precio != null
                                ? `S/ ${item.precio.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`
                                : "Sin precio sugerido"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {loadingRapidos && (
                  <p className="text-sm text-gray-500 mb-3">Cargando productos comunes...</p>
                )}

                <div className="mb-3">
                  <label className="block text-lg font-bold text-gray-900 mb-2">Producto</label>
                  <input
                    ref={productoInputRef}
                    name="producto"
                    value={draftProducto}
                    onChange={(e) => {
                      setDraftProducto(e.target.value);
                      setBloquearSugerencias(false);
                    }}
                    onKeyDown={handleKeyDown}
                    type="text"
                    placeholder="Ej: gaseosa, pan..."
                    className="w-full px-4 py-3 border-2 border-gray-400 rounded text-lg font-semibold focus:outline-none focus:border-gray-600"
                  />
                  {loadingSugerencias && draftProducto.trim().length >= 2 && (
                    <p className="text-xs text-gray-500 mt-1">Buscando sugerencias...</p>
                  )}
                  {sugerencias.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {sugerencias.map((sugerencia) => (
                        <button
                          key={`${sugerencia.nombre}-${sugerencia.precio_sugerido ?? "x"}`}
                          onClick={() => handleSeleccionarSugerencia(sugerencia)}
                          className="w-full text-left px-3 py-2 bg-white border-2 border-gray-300 rounded text-sm font-semibold text-gray-900"
                        >
                          <span className="block capitalize">{sugerencia.nombre}</span>
                          {sugerencia.precio_sugerido != null && (
                            <span className="block text-xs text-gray-600">
                              Precio sugerido: S/{" "}
                              {sugerencia.precio_sugerido.toLocaleString("es-PE", {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-lg font-bold text-gray-900 mb-2">Precio</label>
                  <input
                    ref={precioInputRef}
                    name="precio"
                    value={draftPrecio}
                    onChange={(e) => setDraftPrecio(e.target.value)}
                    onKeyDown={handleKeyDown}
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-4 border-2 border-gray-400 rounded text-xl font-bold focus:outline-none focus:border-gray-600"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded mb-3">
                    <p className="text-base text-red-900 font-bold">{errorMsg}</p>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-green-50 border border-green-300 rounded mb-3">
                    <p className="text-base text-green-900 font-bold">{successMsg}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleGuardarProducto}
                    disabled={savingVenta || !draftProducto || !draftPrecio}
                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-4 px-3 rounded text-xl"
                  >
                    {savingVenta ? "Guardando..." : "+ Guardar producto"}
                  </button>
                  <div className="w-full bg-gray-100 border border-gray-300 rounded text-gray-800 font-bold py-4 px-3 text-center text-lg">
                    3) Se guarda directo en la deuda
                  </div>
                </div>
              </div>

              {productosCliente.length > 0 && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
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
                          <p className="text-lg font-semibold text-gray-900 capitalize">{prod.producto}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(prod.created_at).toLocaleTimeString("es-CO")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900 mb-2">
                            S/ {prod.precio.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
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
                      <p className="text-base font-semibold text-gray-900 capitalize">{venta.producto}</p>
                      <p className="text-sm text-gray-600">{cliente?.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(venta.created_at).toLocaleTimeString("es-CO")}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 ml-2">
                      S/ {venta.precio.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
