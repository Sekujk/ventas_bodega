import { useQuery } from "@tanstack/react-query";
import { clientesService } from "@/services/clientesService";

export const useClients = () => {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: () => clientesService.getClientes(),
  });
};

export const useClientById = (id: string) => {
  return useQuery({
    queryKey: ["cliente", id],
    queryFn: () => clientesService.getClienteById(id),
  });
};