import { useQuery } from "@tanstack/react-query";
import { ventasService } from "@/services/ventasService";

export const useVentasDelDia = () => {
  return useQuery({
    queryKey: ["ventas-dia"],
    queryFn: () => ventasService.getVentasDelDia(),
  });
};

export const useVentasByCliente = (clienteId: string) => {
  return useQuery({
    queryKey: ["ventas", clienteId],
    queryFn: () => ventasService.getVentasByCliente(clienteId),
  });
};

export const useVentas = () => {
  return useQuery({
    queryKey: ["ventas"],
    queryFn: () => ventasService.getVentas(),
  });
};