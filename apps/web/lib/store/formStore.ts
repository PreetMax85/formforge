import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FormStore {
  currentStep:      number;
  direction:        'forward' | 'backward';
  answers:          Record<string, string | string[]>;
  isSubmitting:     boolean;
  isSubmitted:      boolean;
  setAnswer:        (fieldId: string, value: string | string[]) => void;
  nextStep:         () => void;
  prevStep:         () => void;
  setCurrentStep:   (step: number) => void;
  setSubmitting:    (v: boolean) => void;
  setSubmitted:     () => void;
  reset:            () => void;
}

export function createFormStore(formSlug: string, mode: 'preview' | 'live' = 'live') {
  // Scope storage key per mode so builder previews don't bleed into live form
  // sessions for the same slug (and vice versa).
  const storageKey = `formforge-${mode === 'preview' ? 'preview' : 'response'}-${formSlug}`;

  return create<FormStore>()(
    persist(
      (set) => ({
        currentStep:  0,
        direction:    'forward',
        answers:      {},
        isSubmitting: false,
        isSubmitted:  false,

        setAnswer:      (id, val) => set(s => ({ answers: { ...s.answers, [id]: val } })),
        nextStep:       ()        => set(s => ({ currentStep: s.currentStep + 1, direction: 'forward' })),
        prevStep:       ()        => set(s => ({ currentStep: Math.max(0, s.currentStep - 1), direction: 'backward' })),
        setCurrentStep: (step)    => set({ currentStep: step }),
        setSubmitting:  (v)       => set({ isSubmitting: v }),
        setSubmitted:   ()        => set({ isSubmitted: true }),
        reset:          ()        => set({ currentStep: 0, answers: {}, isSubmitted: false }),
      }),
      {
        name:       storageKey,
        storage:    createJSONStorage(() => sessionStorage),
        partialize: (s) => ({ answers: s.answers }),
      }
    )
  );
}
