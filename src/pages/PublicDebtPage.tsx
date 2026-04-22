import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { clientesService } from "@/services/clientesService";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface PublicDebtItem {
  deuda_id: string;
  producto: string;
  precio: number;
  created_at: string;
}

const PublicDebtPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-debt", token],
    queryFn: () => clientesService.getClienteByToken(token || ""),
    enabled: !!token,
  });

  const { data: deudas = [] } = useQuery({
    queryKey: ["public-deudas", token],
    queryFn: () => clientesService.getClientePublicDeudas(token || ""),
    enabled: !!token,
  });

  if (isLoading) return <LoadingSpinner />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto bg-white border-2 border-gray-300 rounded-lg p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deuda</h1>
          <p className="text-gray-600">No se encontró esta deuda.</p>
        </div>
      </div>
    );
  }

  const saldo = Number(data.saldo || 0);
  const consumido = Number(data.total_consumido || 0);
  const pagado = Number(data.total_pagado || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
          <h1 className="text-3xl font-bold text-gray-900">{data.nombre}</h1>
          {data.telefono && (
            <p className="text-sm text-gray-600 mt-1">{data.telefono}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold">Total consumido</p>
            <p className="text-2xl font-bold text-gray-900">
              ${consumido.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold">Total pagado</p>
            <p className="text-2xl font-bold text-gray-900">
              ${pagado.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`rounded-lg p-4 border-2 ${saldo <= 0 ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"}`}>
            <p className="text-xs font-semibold">Saldo</p>
            <p className={`text-3xl font-bold ${saldo <= 0 ? "text-green-900" : "text-red-900"}`}>
              ${Math.abs(saldo).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
          <p className="text-base font-semibold text-gray-900">
            Este enlace muestra el resumen y las deudas.
          </p>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Deudas</h2>
          {deudas.length > 0 ? (
            <div className="space-y-2">
              {deudas.map((deuda: PublicDebtItem) => (
                <div key={deuda.deuda_id} className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-300">
                  <div>
                    <p className="text-base font-semibold text-gray-900 capitalize">{deuda.producto}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(deuda.created_at).toLocaleDateString("es-CO")} {new Date(deuda.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ${Number(deuda.precio).toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No hay deudas registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicDebtPage;
