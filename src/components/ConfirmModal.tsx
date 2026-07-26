import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  isDanger = true,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white rounded-xl shadow-xl max-w-md w-full border border-neutral-100 overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content body */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg shrink-0 ${isDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 leading-6">{title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{message}</p>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 active:scale-98 rounded-lg shadow-xs transition-all duration-150 cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className={`px-4 py-2 text-sm font-semibold text-white active:scale-98 rounded-lg shadow-xs transition-all duration-150 cursor-pointer ${
                  isDanger
                    ? 'bg-red-600 hover:bg-red-500 hover:shadow-md'
                    : 'bg-neutral-950 hover:bg-neutral-800 hover:shadow-md'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
