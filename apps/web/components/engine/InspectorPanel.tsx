'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';
import { FieldInspector } from '~/components/builder/FieldInspector';
import type { Field } from '~/lib/types/field';

interface InspectorPanelProps {
  field: Field | null;
  allFields: Field[];
  onUpdate: (updated: Partial<Field>) => void;
  onDelete?: () => void;
}

/**
 * Right Inspector panel.
 * Shows FieldInspector when a field is selected.
 * Shows an empty state placeholder when nothing is selected.
 */
export function InspectorPanel({ field, allFields, onUpdate, onDelete }: InspectorPanelProps) {
  return (
    <AnimatePresence mode="wait">
      {field ? (
        <motion.div
          key="inspector"
          className="w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <FieldInspector field={field} allFields={allFields} onChange={onUpdate} onDelete={onDelete} />
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          className="flex flex-col items-center justify-center h-full px-6 text-center gap-3"
          style={{ minHeight: '200px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <MousePointerClick size={28} style={{ color: '#3c3c3c' }} />
          <div>
            <p
              style={{
                fontSize: '11px',
                color: '#4b5563',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.6,
              }}
            >
              Nothing selected.
            </p>
            <p
              style={{
                fontSize: '10px',
                color: '#374151',
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: '4px',
              }}
            >
              Click a field to inspect.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}