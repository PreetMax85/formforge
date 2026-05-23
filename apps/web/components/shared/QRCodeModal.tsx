"use client";

import { QRCodeSVG } from 'qrcode.react';
import { XIcon } from 'lucide-react';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-none border border-[#3c3c3c] bg-[#2d2d30] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#cccccc]">Share QR Code</h3>
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
        <p className="mt-3 text-xs text-[#858585]">Scan to open this form</p>
      </div>
    </div>
  );
}
