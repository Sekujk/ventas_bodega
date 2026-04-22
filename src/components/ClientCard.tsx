import React from "react";
import { Cliente } from "@/types";

interface ClientCardProps {
  cliente: Cliente;
  deuda: number;
  onClick: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ cliente, deuda, onClick }) => {
  return (
    <div onClick={onClick} className="card-interactive">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{cliente.nombre}</h3>
          {cliente.telefono && <p className="text-sm text-gray-600">{cliente.telefono}</p>}
        </div>
        <div className={`text-xl font-bold ${deuda > 0 ? "text-red-600" : "text-green-600"}`}>
          S/ {deuda.toFixed(0)}
        </div>
      </div>
    </div>
  );
};