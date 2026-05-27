'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, X, Zap } from 'lucide-react';
import { useState } from 'react';

type Visibility = 'public' | 'unlisted';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (visibility: Visibility) => void;
}

/**
 * Publish modal — framer-motion scale-in entrance.
 * Two visibility options: Public (Explore page) vs Unlisted (link only).
 */
export function PublishModal({ isOpen, onClose, onConfirm }: PublishModalProps) {
  const [visibility, setVisibility] = useState<Visibility>('unlisted');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 50,
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              width: '400px',
              maxWidth: 'calc(100vw - 32px)',
              background: '#252526',
              border: '1px solid #3c3c3c',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #2a2a2a' }}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: '#569cd6' }} />
                <span
                  style={{
                    fontSize: '13px',
                    color: '#d4d4d4',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  Publish Form
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = '#d4d4d4')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = '#6b7280')
                }
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3">
              <p
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '4px',
                }}
              >
                Choose who can discover this form.
              </p>

              {/* Visibility options */}
              {(
                [
                  {
                    value: 'public' as Visibility,
                    icon: Globe,
                    label: 'Public',
                    description: 'Listed on the Explore page. Anyone can find it.',
                    color: '#4ec9b0',
                  },
                  {
                    value: 'unlisted' as Visibility,
                    icon: Lock,
                    label: 'Unlisted',
                    description: 'Only accessible via direct link. Not on Explore.',
                    color: '#9ca3af',
                  },
                ] as const
              ).map(({ value, icon: Icon, label, description, color }) => {
                const isSelected = visibility === value;
                return (
                  <button
                    key={value}
                    onClick={() => setVisibility(value)}
                    className="flex items-start gap-3 p-3 text-left transition-colors w-full"
                    style={{
                      background: isSelected ? '#094771' : '#1e1e1e',
                      border: `1px solid ${isSelected ? '#569cd6' : '#3c3c3c'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={16} style={{ color, marginTop: '1px', flexShrink: 0 }} />
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: isSelected ? '#d4d4d4' : '#9ca3af',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: isSelected ? 600 : 400,
                          marginBottom: '2px',
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-4 py-3"
              style={{ borderTop: '1px solid #2a2a2a' }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: '5px 16px',
                  background: 'transparent',
                  border: '1px solid #3c3c3c',
                  color: '#9ca3af',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = '#5c5c5c')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = '#3c3c3c')
                }
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(visibility)}
                style={{
                  padding: '5px 16px',
                  background: '#569cd6',
                  border: '1px solid #569cd6',
                  color: '#0e0e0e',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Zap size={11} />
                  PUBLISH
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}