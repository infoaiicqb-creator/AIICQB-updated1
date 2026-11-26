import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type PopupType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface CustomPopupProps {
  isOpen: boolean;
  type?: PopupType;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export const CustomPopup: React.FC<CustomPopupProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-[#F47716]" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'confirm':
        return <AlertTriangle className="w-8 h-8 text-[#10264B]" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-[#10264B]" />;
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'warning':
        return 'bg-orange-50 border-orange-100';
      case 'error':
        return 'bg-red-50 border-red-100';
      case 'confirm':
      case 'info':
      default:
        return 'bg-slate-50 border-slate-100';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#10264B] via-[#F47716] to-[#10264B]" />

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getBadgeColor()} flex-shrink-0`}>
                {getIcon()}
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#F47716] uppercase font-montserrat">
                  AIICQB Notification
                </span>
                <h3 className="text-base font-bold text-[#10264B] leading-tight font-montserrat">{title}</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-600 leading-relaxed font-sans pt-1">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  className="px-5 py-2 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#F47716] hover:bg-[#DC660E] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center"
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
