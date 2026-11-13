import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}) => {
  const icons = {
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    danger: <AlertTriangle className="h-6 w-6 text-rose-600" />,
    success: <CheckCircle className="h-6 w-6 text-emerald-600" />,
    info: <Info className="h-6 w-6 text-blue-600" />,
  };

  const buttonColors = {
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex gap-4">
        <div className="shrink-0">{icons[type] || icons.info}</div>
        <div className="text-sm text-slate-600">
          <p>{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-xs focus:ring-2 focus:ring-offset-2 transition ${buttonColors[type]}`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

