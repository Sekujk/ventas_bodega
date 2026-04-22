import { supabase } from "./supabaseClient";

export const pagosService = {
  async createPago(clienteId: string, monto: number) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from("pagos")
      .insert([{ cliente_id: clienteId, monto, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPagosByCliente(clienteId: string) {
    const { data, error } = await supabase
      .from("pagos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async deletePago(id: string) {
    const { error } = await supabase.from("pagos").delete().eq("id", id);
    if (error) throw error;
  },
};