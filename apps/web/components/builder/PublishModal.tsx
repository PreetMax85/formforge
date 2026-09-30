'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, X, Zap } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

type Visibility = 'public' | 'unlisted';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (visibility: Visibility) => void;
  isPublishing: boolean;
  /**
   * The visibility the form is live with, once it has been published.
   * Leave it out for a first publish, which starts on Unlisted.
   */
  currentVisibility?: Visibility;
}

/**
 * Publish modal — framer-motion scale-in entrance.
 * Two visibility options: Public (Explore page) vs Unlisted (link only).
 * Radix Dialog supplies the dialog role, Esc to close, and focus trap/restore.
 */
export function PublishModal({ isOpen, onClose, onConfirm, isPublishing, currentVisibility }: PublishModalProps) {
  const initialVisibility: Visibility = currentVisibility ?? 'unlisted';
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);

  // Start from the form's own visibility every time the modal opens. It used
  // to start on Unlisted, so "Publish changes" on a Public form delisted it
  // unless the creator noticed. Set during render, not in an effect, so the
  // first frame of the modal already shows the right option.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setVisibility(initialVisibility);
  }

  // Radix returns focus to a <Dialog.Trigger> on close, but this modal is
  // opened by the page (after its unsaved-changes check), so there is none.
  // Remember what had focus instead. A layout effect runs before Radix's own
  // effect moves focus into the dialog.
  const openerRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (isOpen && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal key="publish-modal" forceMount>
            {/* Backdrop — Radix closes the dialog on a click outside it */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.7)',
                  zIndex: 50,
                }}
              />
            </Dialog.Overlay>

            {/* Centring lives on this plain wrapper, not the card: framer-motion
                writes its own transform for `scale`, which replaced a
                translate(-50%, -50%) and pushed the card off-screen. */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 51,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                pointerEvents: 'none',
              }}
            >
              <Dialog.Content
                asChild
                forceMount
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  openerRef.current?.focus();
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    pointerEvents: 'auto',
                    width: '400px',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    overflowY: 'auto',
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
                      <Zap size={14} style={{ color: '#569cd6' }} aria-hidden />
                      <Dialog.Title
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#d4d4d4',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      >
                        Publish Form
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      aria-label="Close"
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
                    <Dialog.Description
                      style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '4px',
                      }}
                    >
                      Choose who can discover this form.
                    </Dialog.Description>

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
                          aria-pressed={isSelected}
                          className="flex items-start gap-3 p-3 text-left transition-colors w-full"
                          style={{
                            background: isSelected ? '#094771' : '#1e1e1e',
                            border: `1px solid ${isSelected ? '#569cd6' : '#3c3c3c'}`,
                            cursor: 'pointer',
                          }}
                        >
                          <Icon size={16} style={{ color, marginTop: '1px', flexShrink: 0 }} aria-hidden />
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
                    {/* Disabled while publishing: a double click published twice */}
                    <button
                      onClick={() => onConfirm(visibility)}
                      disabled={isPublishing}
                      style={{
                        padding: '5px 16px',
                        background: '#569cd6',
                        border: '1px solid #569cd6',
                        color: '#0e0e0e',
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        cursor: isPublishing ? 'not-allowed' : 'pointer',
                        opacity: isPublishing ? 0.7 : 1,
                        letterSpacing: '0.04em',
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap size={11} aria-hidden />
                        {isPublishing ? 'PUBLISHING...' : 'PUBLISH'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}