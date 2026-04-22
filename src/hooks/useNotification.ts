/**
 * Hook reutilizable para manejar notificaciones (errores y éxito)
 * Evita duplicar lógica de notificaciones en todos los componentes
 */

import { useState, useCallback } from 'react';

export interface Notification {
  type: 'success' | 'error';
  message: string;
  id?: number;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<Notification | null>(null);

  /**
   * Muestra una notificación de error
   */
  const error = useCallback((message: string, duration = 3000) => {
    setNotification({
      type: 'error',
      message,
      id: Date.now(),
    });

    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  }, []);

  /**
   * Muestra una notificación de éxito
   */
  const success = useCallback((message: string, duration = 2000) => {
    setNotification({
      type: 'success',
      message,
      id: Date.now(),
    });

    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  }, []);

  /**
   * Limpia la notificación manual
   */
  const clear = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    error,
    success,
    clear,
  };
};
