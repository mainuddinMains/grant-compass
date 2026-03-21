'use client';

import { useEffect, useRef, useState } from 'react';
import type { Grant } from '@/lib/nih';

interface LetterModalProps {
  grant: Grant & { score?: number; reason?: string };
  researchDescription: string;
  onClose: () => void;
}

type CopyState = 'idle' | 'copied' | 'error';

export default function LetterModal({ grant, researchDescription, onClose }: LetterModalProps) {
  const [letter, setLetter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Generate letter on mount
  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const res = await fetch('/api/letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researchDescription, grant }),
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();
        if (!cancelled) setLetter(data.letter ?? '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to generate letter.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [grant, researchDescription]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Letter of Intent</h2>
            <p className="mt-0.5 text-sm text-gray-500 truncate">{grant.title}</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
              <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm">Claude is writing your letter…</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <textarea
              readOnly
              value={letter}
              className="w-full h-full min-h-[420px] resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <span className="text-xs text-gray-400">
            {!isLoading && !error && `${letter.length} characters`}
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              disabled={isLoading || !!error || !letter}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copyState === 'copied' ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : copyState === 'error' ? (
                'Copy failed'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
