export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  token_acceso: string;
  created_at: string;
  updated_at: string;
}

export interface Venta {
  id: string;
  cliente_id?: string;
  producto: string;
  precio: number;
  created_at: string;
}

export interface Pago {
  id: string;
  cliente_id: string;
  monto: number;
  created_at: string;
}

export interface Producto {
  nombre: string;
  precio_sugerido?: number;
}

export interface ClienteDeuda {
  cliente_id: string;
  nombre: string;
  total_consumido: number;
  total_pagado: number;
  saldo: number;
}
