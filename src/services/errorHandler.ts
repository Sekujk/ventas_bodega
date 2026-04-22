/**
 * Servicio centralizado para manejar errores de Supabase
 * Convierte errores técnicos en mensajes amigables en español
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  message: string;
  code: string;
  details?: string;
}

export function handleApiError(error: any): ErrorResponse {
  // Error de autenticación
  if (error?.status === 401 || error?.code === 'PGRST301') {
    return {
      message: 'No autenticado. Por favor inicia sesión.',
      code: 'AUTH_ERROR',
      details: 'Tu sesión ha expirado.',
    };
  }

  // Error de permiso
  if (error?.status === 403 || error?.code === 'PGRST304') {
    return {
      message: 'No tienes permisos para esta acción.',
      code: 'PERMISSION_ERROR',
      details: 'Verifica que sea tu cliente.',
    };
  }

  // Error de no encontrado
  if (error?.status === 404 || error?.code === 'PGRST116') {
    return {
      message: 'Registro no encontrado.',
      code: 'NOT_FOUND',
      details: 'El cliente o venta que buscas no existe.',
    };
  }

  // Error de constraint (violación de regla)
  if (error?.code === '23505') {
    return {
      message: 'Este registro ya existe.',
      code: 'DUPLICATE_ERROR',
      details: 'No puedes duplicar un cliente con el mismo nombre.',
    };
  }

  // Error de not null
  if (error?.code === '23502') {
    return {
      message: 'Falta información requerida.',
      code: 'REQUIRED_FIELD',
      details: 'Completa todos los campos obligatorios.',
    };
  }

  // Error de foreign key
  if (error?.code === '23503') {
    return {
      message: 'No puedes eliminar esto porque está en uso.',
      code: 'FOREIGN_KEY_ERROR',
      details: 'El cliente tiene ventas o pagos asociados.',
    };
  }

  // Error de tipo de dato
  if (error?.code === '22P02' || error?.code === '22007') {
    return {
      message: 'El formato de los datos es incorrecto.',
      code: 'INVALID_FORMAT',
      details: 'Verifica que los números sean válidos.',
    };
  }

  // Error de red
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('offline')) {
    return {
      message: 'Error de conexión.',
      code: 'NETWORK_ERROR',
      details: 'Verifica tu conexión a internet.',
    };
  }

  // Error genérico de Supabase
  if (error?.message) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid login credentials')) {
      return {
        message: 'Email o contraseña incorrectos.',
        code: 'INVALID_CREDENTIALS',
      };
    }

    if (message.includes('user already registered')) {
      return {
        message: 'Este email ya está registrado.',
        code: 'USER_EXISTS',
      };
    }

    return {
      message: error.message,
      code: 'SUPABASE_ERROR',
    };
  }

  // Error desconocido
  return {
    message: 'Algo salió mal. Intenta de nuevo.',
    code: 'UNKNOWN_ERROR',
    details: import.meta.env.NODE_ENV === 'development' ? JSON.stringify(error) : undefined,
  };
}

/**
 * Extrae mensaje amigable de cualquier tipo de error
 */
export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error?.message && typeof error.message === 'string') {
    const response = handleApiError(error);
    return response.message;
  }

  const response = handleApiError(error);
  return response.message;
}
