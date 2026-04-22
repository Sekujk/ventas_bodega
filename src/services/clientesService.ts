import { supabase } from "./supabaseClient";

export const clientesService = {
  async getClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getClienteById(id: string) {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async createCliente(nombre: string, telefono?: string) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("No autenticado");

    const { data, error } = await supabase
      .from("clientes")
      .insert([{ nombre, telefono, user_id: user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCliente(id: string, nombre: string, telefono?: string) {
    const { data, error } = await supabase
      .from("clientes")
      .update({ nombre, telefono, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCliente(id: string) {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) throw error;
  },

  async getClienteByToken(token: string) {
    const { data, error } = await supabase.rpc("get_client_public_data", {
      p_token: token,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  async getClientePublicDeudas(token: string) {
    const { data, error } = await supabase.rpc("get_client_public_deudas", {
      p_token: token,
    });
    if (error) throw error;
    return data ?? [];
  },
};
