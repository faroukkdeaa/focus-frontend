import { useContext } from 'react';
import { NotificationContext_internal } from '../context/NotificationContext';

export const useNotifications = () => {
  const ctx = useContext(NotificationContext_internal);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
};
