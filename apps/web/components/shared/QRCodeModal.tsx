"use client";

import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { XIcon } from 'lucide-react';

interface QRCodeModalProps {
  isOpen:    boolean;
  url:       string;
  formTitle?: string;
  onClose:   () => void;
}

export default function QRCodeModal({ isOpen, url, formTitle, onClose }: QRCodeModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-none border border-[#3c3c3c] bg-[#2d2d30] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize:   '15px',
              fontWeight: 600,
              color:      '#d4d4d4',
            }}
          >
            {formTitle ?? 'Share QR Code'}
          </h3>
          <button
            onClick={onClose}
            className="text-[#858585] hover:text-[#cccccc]"
          >
            <XIcon size={16} />
          </button>
        </div>
        <div className="bg-white p-4">
          <QRCodeSVG value={url} size={200} />
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize:   '10px',
            color:      '#6b7280',
            marginTop:  '12px',
            textAlign:  'center',
          }}
        >
          Scan to open this form
        </p>
      </div>
    </div>
  );
}
