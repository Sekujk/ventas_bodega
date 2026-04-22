import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ventasService } from "@/services/ventasService";
import { LargeButton } from "@/components/LargeButton";
import { InputField } from "@/components/InputField";

const QuickSalePage: React.FC = () => {
  const [producto, setProducto] = useState("");
  const [precio, setPrecio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!producto || !precio) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (parseFloat(precio) <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ventasService.createVenta(null, producto.toLowerCase(), parseFloat(precio));
      setSuccess(true);
      setProducto("");
      setPrecio("");
      
      setTimeout(() => {
        setSuccess(false);
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container-max px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-4 py-3 rounded border border-gray-300"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold mt-2">➕ Venta Rápida</h1>
          <p className="text-gray-600 text-sm mt-1">Registra una venta sin cliente</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-max px-4 py-6 max-w-md">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg animate-slide-up">
            <p className="text-green-700 font-semibold">✅ ¡Venta guardada correctamente!</p>
            <p className="text-green-600 text-sm mt-1">Redirigiendo al dashboard...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="card-elevated space-y-6">
          <div>
            <InputField
              label="Nombre del Producto"
              value={producto}
              onChange={setProducto}
              placeholder="Ej: gaseosa, pan, arroz..."
              required
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">Ejemplo: "gaseosa", "pan", "leche"</p>
          </div>

          <div>
            <InputField
              label="Precio"
              value={precio}
              onChange={setPrecio}
              type="number"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">Ingresa solo el número</p>
          </div>

          {/* Summary */}
          {producto && precio && !error && (
            <div className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Resumen:</strong>
              </p>
              <p className="text-lg font-bold text-blue-900 mt-2">
                {producto} — ${parseFloat(precio).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          <LargeButton onClick={handleSave} disabled={loading} variant="primary">
            {loading ? "⏳ Guardando..." : "✅ Guardar Venta"}
          </LargeButton>
          <LargeButton onClick={() => navigate("/")} variant="secondary">
            ❌ Cancelar
          </LargeButton>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-900">
            💡 <strong>Tip:</strong> Las ventas rápidas se registran sin cliente y se suman al total del día.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickSalePage;
