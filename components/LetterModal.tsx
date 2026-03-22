'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Grant } from '@/lib/nih';
import type { ResearcherProfile } from '@/components/ProfileForm';

interface LetterModalProps {
  grant: Grant & { score?: number; reason?: string };
  researchDescription: string;
  profile: ResearcherProfile | null;
  onClose: () => void;
}

type CopyState = 'idle' | 'copied' | 'error';

export default function LetterModal({ grant, researchDescription, profile, onClose }: LetterModalProps) {
  const [letter, setLetter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Used to cancel in-flight requests when the component unmounts or regenerates
  const cancelRef = useRef(false);

  /* ── Letter generation ──────────────────────────────────── */

  const generateLetter = useCallback(async () => {
    cancelRef.current = false;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchDescription, grant, profile }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (!cancelRef.current) setLetter(data.letter ?? '');
    } catch (err) {
      if (!cancelRef.current)
        setError(err instanceof Error ? err.message : 'Failed to generate letter.');
    } finally {
      if (!cancelRef.current) setIsLoading(false);
    }
  // grant/researchDescription/profile are stable for the lifetime of this modal instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate on mount
  useEffect(() => {
    generateLetter();
    return () => { cancelRef.current = true; };
  }, [generateLetter]);

  /* ── Auto-resize textarea to fit content ────────────────── */

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [letter]);

  /* ── Keyboard & scroll lock ─────────────────────────────── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ── Handlers ───────────────────────────────────────────── */

  const handleRegenerate = () => {
    if (letter && !window.confirm('This will replace your edits. Continue?')) return;
    generateLetter();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const escaped = letter
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const safeTitle = grant.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Letter of Intent — ${safeTitle}</title>
  <style>
    @page { size: letter; margin: 1in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #000;
      background: #fff;
    }
    .meta {
      border-bottom: 1px solid #ccc;
      padding-bottom: 10pt;
      margin-bottom: 18pt;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #555;
    }
    .meta .grant-title {
      font-size: 10pt;
      font-weight: bold;
      color: #111;
      margin-top: 3pt;
    }
    .letter { white-space: pre-wrap; word-break: break-word; }
    .footer {
      margin-top: 36pt;
      border-top: 1px solid #ddd;
      padding-top: 8pt;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8pt;
      color: #999;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="meta">
    <div>Generated on ${today} · Grant Compass</div>
    <div class="grant-title">${safeTitle}</div>
  </div>
  <div class="letter">${escaped}</div>
  <div class="footer">Generated by Grant Compass · Review and edit before submission</div>
  <script>window.onload = function() { window.print(); window.close(); };<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  const canAct = !isLoading && !error && !!letter;

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white shadow-2xl">

        {/* ── Modal header ──────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Letter of Intent</h2>
            <p className="mt-0.5 text-sm text-gray-400 truncate">{grant.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm">Claude is writing your letter…</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Editor area (shown once letter is ready) */}
          {!isLoading && !error && (
            <>
              {/* ── Toolbar ──────────────────────────── */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Regenerate */}
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>

                <div className="h-4 w-px bg-gray-200" />

                {/* Copy */}
                <button
                  onClick={handleCopy}
                  disabled={!canAct}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {copyState === 'copied' ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : copyState === 'error' ? (
                    'Copy failed'
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy to Clipboard
                    </>
                  )}
                </button>

                {/* Download PDF */}
                <button
                  onClick={handlePrint}
                  disabled={!canAct}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Edit hint */}
              <p className="text-xs text-gray-400 -mt-1">
                ✏️ You can edit this letter directly before downloading
              </p>

              {/* Editable textarea — auto-resizes to content height */}
              <textarea
                ref={textareaRef}
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                spellCheck
                className="w-full min-h-[320px] resize-none overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-[Georgia,_'Times_New_Roman',_serif] text-[13.5px] leading-[1.75] text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
              />

              {/* Character count */}
              <p className="text-xs text-gray-400 text-right -mt-2">
                {letter.length.toLocaleString()} characters
              </p>
            </>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
