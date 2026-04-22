import { useQuery } from "@tanstack/react-query";
import { pagosService } from "@/services/pagosService";

export const usePagosByCliente = (clienteId: string) => {
  return useQuery({
    queryKey: ["pagos", clienteId],
    queryFn: () => pagosService.getPagosByCliente(clienteId),
    enabled: !!clienteId,
  });
};
