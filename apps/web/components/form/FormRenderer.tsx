'use client';

/**
 * ARCHITECTURAL RULE: This is the ONLY form renderer in the codebase.
 * Used in exactly two places:
 *   1. dashboard/forms/[id]/builder/page.tsx — mode='preview'
 *   2. f/[slug]/page.tsx                     — mode='live'
 * NEVER create a second renderer.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { trpc } from '~/trpc/client';
import { createFormStore } from '~/lib/store/formStore';
import { ProgressBar } from './ProgressBar';
import { FormField } from './FormField';
import { ThankYouScreen } from './ThankYouScreen';
import type { Field } from '~/lib/types/field';
import type { Field as SharedField } from '@repo/shared';

/* ── Types ────────────────────────────────────────────────────────── */
interface FormConfig {
  id:              string;
  slug:            string;
  title:           string;
  description:     string | null;
  theme:           string;
  showProgressBar: boolean;
  requireEmail:    boolean;
  allowAnonymous:  boolean;
  thankYouTitle:   string | null;
  thankYouMessage: string | null;
  fields:          Field[];
}

interface FormRendererProps {
  formConfig: FormConfig;
  mode:       'preview' | 'live';
}

/* ── Slide animation variants ─────────────────────────────────────── */
const slideVariants = {
  enter: (dir: 'forward' | 'backward') => ({
    x:       dir === 'forward' ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: 'forward' | 'backward') => ({
    x:       dir === 'forward' ? -60 : 60,
    opacity: 0,
  }),
};

/**
 * Shared form renderer.
 * One question at a time, framer-motion slide transitions, full theme support.
 */
export function FormRenderer({ formConfig, mode }: FormRendererProps) {
  // useMemo: store created ONCE per slug+mode — never recreated on re-render
  const useFormStore = useMemo(
    () => createFormStore(formConfig.slug, mode),
    [formConfig.slug, mode]
  );
  const {
    currentStep,
    direction,
    answers,
    isSubmitting,
    isSubmitted,
    setAnswer,
    nextStep,
    prevStep,
    setSubmitting,
    setSubmitted,
    reset,
    getVisibleFields,
    getProgress,
  } = useFormStore();

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [respondentEmail, setRespondentEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  /* Honeypot ref — bots fill this hidden input; humans never see it. */
  const hpRef = useRef<HTMLInputElement>(null);

  /* ── Enter key advances to next step ──────────────────────────── */
  const handleNextRef = useRef<() => void>(() => {});

  /* Visible fields respects conditional logic */
  const visibleFields = getVisibleFields(formConfig.fields as unknown as SharedField[]);
  const totalSteps    = visibleFields.length;
  const currentField  = visibleFields[Math.min(currentStep, visibleFields.length - 1)] ?? null;
  const isLastStep    = currentStep === totalSteps - 1;
  const progress      = getProgress(formConfig.fields as unknown as SharedField[]);

  /* Submit mutation — always called (hooks can't be conditional) */
  const submitMutation = trpc.responses.submit.useMutation({
    onSuccess: () => {
      setSubmitted();
    },
    onError: (err) => {
      setFieldError(err.message);
      setSubmitting(false);
    },
  });

  /* ── Validation ─────────────────────────────────────────────── */
  function validateCurrentField(): boolean {
    if (!currentField) return true;
    const answer = answers[currentField.id];
    const isEmpty =
      answer === undefined ||
      answer === '' ||
      (Array.isArray(answer) && answer.length === 0) ||
      answer === 'false';

    if (currentField.required && isEmpty) {
      setFieldError('This field is required.');
      return false;
    }

    if (currentField.type === 'email' && answer && typeof answer === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
        setFieldError('Please enter a valid email address.');
        return false;
      }
    }

    if (currentField.type === 'number' && answer && typeof answer === 'string' && answer !== '') {
      if (isNaN(Number(answer))) {
        setFieldError('Please enter a valid number.');
        return false;
      }
    }

    setFieldError(null);
    return true;
  }

  /* ── Navigation ─────────────────────────────────────────────── */
  function handleNext() {
    if (!validateCurrentField()) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      nextStep();
    }
  }

  function handlePrev() {
    setFieldError(null);
    prevStep();
  }

  /* Keep ref in sync so the keydown listener always calls latest handleNext */
  handleNextRef.current = handleNext;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'button') return;
      e.preventDefault();
      handleNextRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Submit ──────────────────────────────────────────────────── */
  function handleSubmit() {
    if (mode === 'preview') {
      // Preview mode: run full validation then show preview banner
      let hasError = false;
      for (const f of visibleFields) {
        const answer = answers[f.id];
        const isEmpty =
          answer === undefined ||
          answer === '' ||
          (Array.isArray(answer) && answer.length === 0) ||
          answer === 'false';
        if (f.required && isEmpty) {
          setFieldError(`"${f.label}" is required.`);
          hasError = true;
          break;
        }
      }
      if (!hasError) setSubmitted();
      return;
    }

    // Require email check
    if (formConfig.requireEmail && !respondentEmail) {
      setEmailError('Email is required to submit this form.');
      return;
    }
    if (respondentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError(null);

    // Collect answers into AnswerSchema format — only visible fields
    const visibleIds = new Set(visibleFields.map(f => f.id));
    const answersArr = Object.entries(answers)
      .filter(([fieldId]) => visibleIds.has(fieldId))
      .map(([fieldId, value]) => ({ fieldId, value }));

    if (answersArr.length === 0) {
      setFieldError('Please answer at least one question.');
      return;
    }

    setSubmitting(true);
    submitMutation.mutate({
      formSlug:        formConfig.slug,
      answers:         answersArr,
      respondentEmail: respondentEmail || undefined,
      sendEmailCopy:   !!respondentEmail,
      _hp:             hpRef.current?.value ?? '',
    });
  }

  /* ── Thank you screen ────────────────────────────────────────── */
  if (isSubmitted) {
    return (
      <ThankYouScreen
        title={formConfig.thankYouTitle ?? 'Thank you!'}
        message={formConfig.thankYouMessage ?? 'Your response has been recorded.'}
        onReset={mode === 'live' ? reset : undefined}
      />
    );
  }

  /* ── Empty form ──────────────────────────────────────────────── */
  if (totalSteps === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}
      >
        No fields in this form yet.
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────────────────── */
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'var(--bg-primary)', position: 'relative', zIndex: 1 }}
    >
      {/* Preview banner */}
      {mode === 'preview' && (
        <div
          className="flex items-center justify-center gap-2 py-2"
          style={{
            background:  'rgba(86,156,214,0.1)',
            borderBottom:'1px solid rgba(86,156,214,0.3)',
            fontSize:    '11px',
            color:       '#569cd6',
            fontFamily:  "'JetBrains Mono', monospace",
          }}
        >
          <Eye size={12} />
          PREVIEW MODE — submissions are disabled
        </div>
      )}

      {/* Form title + description header */}
      <div style={{ padding: '32px 24px 0', maxWidth: '560px', margin: '0 auto', width: '100%' }}>
        <h1
          style={{
            fontSize:    '26px',
            fontWeight:  700,
            color:       'var(--text-primary)',
            fontFamily:  "'Space Grotesk', sans-serif",
            lineHeight:  1.25,
            margin:      0,
          }}
        >
          {formConfig.title}
        </h1>
        {formConfig.description && (
          <p
            style={{
              fontSize:    '13px',
              color:       'var(--text-secondary)',
              fontFamily:  "'Inter', sans-serif",
              lineHeight:  1.5,
              margin:      '8px 0 0',
            }}
          >
            {formConfig.description}
          </p>
        )}
      </div>

      {/* Honeypot anti-spam field — read via hpRef in handleSubmit. */}
      <input
        ref={hpRef}
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
        aria-hidden="true"
        style={{ display: 'none', position: 'absolute' }}
      />

      {/* Progress bar */}
      {formConfig.showProgressBar && (
        <div style={{ padding: '16px 24px 0' }}>
          <ProgressBar
            progress={progress}
            label={`${currentStep + 1} of ${totalSteps}`}
          />
        </div>
      )}

      {/* Field area — centered, full remaining height */}
      <div className="flex flex-col flex-1 items-center justify-center px-6 py-12">
        <div style={{ width: '100%', maxWidth: '560px' }}>

          {/* Step counter */}
          <div
            style={{
              fontSize:    '12px',
              color:       'var(--text-accent)',
              fontFamily:  "'JetBrains Mono', monospace",
              marginBottom:'20px',
              letterSpacing:'0.08em',
            }}
          >
            {String(currentStep + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
          </div>

          {/* Animated field */}
          <AnimatePresence mode="wait" custom={direction}>
            {currentField && (
              <motion.div
                key={currentField.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Label */}
                <h2
                  style={{
                    fontSize:    '22px',
                    fontWeight:  600,
                    color:       'var(--text-primary)',
                    fontFamily:  "'Space Grotesk', sans-serif",
                    marginBottom:currentField.description ? '8px' : '24px',
                    lineHeight:  1.3,
                  }}
                >
                  {currentField.label}
                  {currentField.required && (
                    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                  )}
                </h2>

                {/* Description */}
                {currentField.description && (
                  <p
                    style={{
                      fontSize:    '14px',
                      color:       'var(--text-secondary)',
                      fontFamily:  "'Inter', sans-serif",
                      marginBottom:'24px',
                      lineHeight:  1.6,
                    }}
                  >
                    {currentField.description}
                  </p>
                )}

                {/* Input */}
                <FormField
                  field={currentField as unknown as Field}
                  value={answers[currentField.id] ?? (
                    currentField.type === 'multi_select' ? [] : ''
                  )}
                  onChange={(val) => {
                    setAnswer(currentField.id, val);
                    setFieldError(null);
                  }}
                  error={fieldError ?? undefined}
                />

                {/* Email collection on last step (if requireEmail) */}
                {isLastStep && formConfig.requireEmail && (
                  <div style={{ marginTop: '28px' }}>
                    <label
                      style={{
                        display:     'block',
                        fontSize:    '13px',
                        color:       'var(--text-secondary)',
                        fontFamily:  "'JetBrains Mono', monospace",
                        marginBottom:'8px',
                        letterSpacing:'0.04em',
                      }}
                    >
                      YOUR EMAIL{' '}
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={respondentEmail}
                      onChange={(e) => {
                        setRespondentEmail(e.target.value);
                        setEmailError(null);
                      }}
                      placeholder="you@example.com"
                      style={{
                        width:      '100%',
                        padding:    '12px 16px',
                        background: 'var(--bg-secondary)',
                        border:     `1px solid ${emailError ? '#ef4444' : 'var(--border)'}`,
                        color:      'var(--text-primary)',
                        fontSize:   '15px',
                        fontFamily: "'Inter', sans-serif",
                        outline:    'none',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--text-accent)'; }}
                      onBlur={(e)  => { e.currentTarget.style.borderColor = emailError ? '#ef4444' : 'var(--border)'; }}
                    />
                    {emailError && (
                      <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>
                        {emailError}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-3" style={{ marginTop: '36px' }}>
            {/* Prev */}
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5"
                style={{
                  padding:    '10px 18px',
                  background: 'transparent',
                  border:     '1px solid var(--border)',
                  color:      'var(--text-secondary)',
                  fontSize:   '14px',
                  fontFamily: "'Inter', sans-serif",
                  cursor:     'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-accent)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }}
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            {/* Next / Submit */}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 ml-auto"
              style={{
                padding:    '10px 24px',
                background: isSubmitting ? 'var(--border)' : 'var(--text-accent)',
                border:     '1px solid var(--text-accent)',
                color:      isSubmitting ? 'var(--text-secondary)' : '#0e0e0e',
                fontSize:   '14px',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                cursor:     isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                opacity:    isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Submitting...'
                : isLastStep
                ? 'Submit'
                : (
                  <>
                    Next
                    <ChevronRight size={16} />
                  </>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}