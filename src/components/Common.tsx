import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Logo = ({ size = 40, className = "", src = "/icone.png" }: { size?: number, className?: string, src?: string | null }) => {
  const logoSrc = src && typeof src === 'string' && src.trim() !== "" ? src : "/icone.png";
  
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl ${className}`} style={{ width: size, height: size }}>
      <img src={logoSrc} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-bottom flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Excluir", 
  confirmColor = "bg-red-600" 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string, 
  confirmText?: string, 
  confirmColor?: string 
}) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-slate-600">{message}</p>
        <div className="flex justify-end gap-3 pt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 ${confirmColor} text-white rounded-xl transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
