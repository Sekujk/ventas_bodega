import { supabase } from "./supabaseClient";

export const ventasService = {
  async createVenta(clienteId: string | null, producto: string, precio: number) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from("ventas")
      .insert([{ cliente_id: clienteId, producto, precio, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getVentasByCliente(clienteId: string) {
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getVentasDelDia() {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .gte("created_at", today)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getVentas() {
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getProductSuggestions(prefix: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("No autenticado");

    const { data, error } = await supabase.rpc("get_product_suggestions", {
      prefix,
      user_id: user.id,
      limit_count: 10,
    });
    if (error) throw error;
    return data;
  },

  async deleteVenta(id: string) {
    const { error } = await supabase.from("ventas").delete().eq("id", id);
    if (error) throw error;
  },
};
