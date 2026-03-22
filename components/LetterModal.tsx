'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Grant } from '@/lib/nih';
import type { ResearcherProfile } from '@/components/ProfileForm';

/* ── Types ──────────────────────────────────────────────────── */

type FontSize = 'small' | 'normal' | 'large';
type TextAlign = 'left' | 'center' | 'right';
type CopyState = 'idle' | 'copied' | 'error';

interface Version {
  content: string;
  label: string;
  at: Date;
}

interface LetterModalProps {
  grant: Grant & { score?: number; reason?: string };
  researchDescription: string;
  profile: ResearcherProfile | null;
  onClose: () => void;
}

/* ── Constants ──────────────────────────────────────────────── */

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '12px',
  normal: '14px',
  large: '16px',
};

const TONES = ['Formal', 'Persuasive', 'Concise', 'Detailed'] as const;

/* ── Markdown preview renderer ──────────────────────────────── */

function renderMarkdown(raw: string): string {
  return raw
    .split('\n')
    .map((line) => {
      // Escape HTML, then restore safe <u> tags we inserted
      const esc = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;u&gt;/g, '<u>')
        .replace(/&lt;\/u&gt;/g, '</u>');

      const fmt = esc
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>');

      if (/^- /.test(fmt))
        return `<div style="padding-left:1.25em">• ${fmt.slice(2)}</div>`;
      if (/^\d+\. /.test(fmt))
        return `<div style="padding-left:1.25em">${fmt}</div>`;
      if (!fmt.trim()) return '<div style="height:0.75em"></div>';
      return `<div>${fmt}</div>`;
    })
    .join('');
}

/* ── Formatting helpers ─────────────────────────────────────── */

/** Wraps the current textarea selection with prefix/suffix. */
function applyInlineFormat(
  ta: HTMLTextAreaElement,
  letter: string,
  prefix: string,
  suffix: string,
): string {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const next =
    letter.slice(0, s) + prefix + letter.slice(s, e) + suffix + letter.slice(e);
  requestAnimationFrame(() => {
    ta.selectionStart = s + prefix.length;
    ta.selectionEnd = e + prefix.length;
    ta.focus();
  });
  return next;
}

/** Prefixes every selected line with a string from makePrefix(lineIndex). */
function applyLinePrefix(
  ta: HTMLTextAreaElement,
  letter: string,
  makePrefix: (i: number) => string,
): string {
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const lineStart = letter.lastIndexOf('\n', s - 1) + 1;
  const rawEnd = letter.indexOf('\n', e);
  const lineEnd = rawEnd === -1 ? letter.length : rawEnd;

  const chunk = letter.slice(lineStart, lineEnd);
  const lines = chunk.split('\n');
  const prefixed = lines.map((l, i) => makePrefix(i) + l).join('\n');
  const delta = prefixed.length - chunk.length;

  const next = letter.slice(0, lineStart) + prefixed + letter.slice(lineEnd);
  requestAnimationFrame(() => {
    ta.selectionStart = s + makePrefix(0).length;
    ta.selectionEnd = e + delta;
    ta.focus();
  });
  return next;
}

/* ── Toolbar button ─────────────────────────────────────────── */

function TBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Spinner ─────────────────────────────────────────────────── */

function Spinner({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function LetterModal({
  grant,
  researchDescription,
  profile,
  onClose,
}: LetterModalProps) {
  /* Content */
  const [letter, setLetter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  /* Editor config */
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [splitView, setSplitView] = useState(false);

  /* AI tools */
  const [tone, setTone] = useState<string>('Formal');
  const [rewriteAction, setRewriteAction] = useState<string | null>(null);

  /* Version history (max 5) */
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const versionsRef = useRef<HTMLDivElement>(null);

  /* Refs */
  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef(false);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

  /* Derived stats */
  const words = letter.trim() ? letter.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  /* ── Version history ──────────────────────────────────────── */

  const saveVersion = (label: string, content: string) => {
    if (!content) return;
    setVersions((prev) =>
      [{ content, label, at: new Date() }, ...prev].slice(0, 5),
    );
  };

  /* Close versions dropdown on outside click */
  useEffect(() => {
    if (!showVersions) return;
    const handler = (e: MouseEvent) => {
      if (!versionsRef.current?.contains(e.target as Node)) setShowVersions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVersions]);

  /* ── Undo / Redo ──────────────────────────────────────────── */

  const pushUndo = (prev: string) => {
    undoStack.current = [...undoStack.current, prev].slice(-50);
    redoStack.current = [];
  };

  const applyLetter = (next: string) => {
    pushUndo(letter);
    setLetter(next);
  };

  const undo = () => {
    if (!undoStack.current.length) return;
    redoStack.current = [letter, ...redoStack.current];
    setLetter(undoStack.current.pop()!);
  };

  const redo = () => {
    if (!redoStack.current.length) return;
    undoStack.current = [...undoStack.current, letter];
    setLetter(redoStack.current.shift()!);
  };

  /* ── Letter generation ────────────────────────────────────── */

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
    // props are stable for the lifetime of this modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    generateLetter();
    return () => {
      cancelRef.current = true;
    };
  }, [generateLetter]);

  /* ── AI Rewrite ───────────────────────────────────────────── */

  const rewrite = async (action: string, toneParam?: string) => {
    if (!window.confirm('Replace your current letter with the improved version?')) return;
    const label =
      action === 'tone'
        ? `Tone: ${toneParam}`
        : { formal: 'Make Formal', shorter: 'Make Shorter', stronger: 'Make Stronger', grammar: 'Fix Grammar' }[action] ?? action;
    saveVersion(label, letter);
    setRewriteAction(action);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: letter, action, tone: toneParam }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      pushUndo(letter);
      setLetter(data.rewritten ?? letter);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rewrite failed');
    } finally {
      setRewriteAction(null);
    }
  };

  /* ── Regenerate ───────────────────────────────────────────── */

  const handleRegenerate = () => {
    if (letter && !window.confirm('This will replace your edits. Continue?')) return;
    if (letter) saveVersion('Before regenerate', letter);
    generateLetter();
  };

  /* ── Keyboard & scroll lock ───────────────────────────────── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  /* ── Copy ─────────────────────────────────────────────────── */

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

  /* ── Print / PDF ──────────────────────────────────────────── */

  const handlePrint = () => {
    const pw = window.open('', '_blank', 'width=800,height=900');
    if (!pw) return;
    const esc = letter
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const safeTitle = grant.title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    pw.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Letter of Intent — ${safeTitle}</title>
<style>
@page{size:letter;margin:1in}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',Times,serif;font-size:12pt;line-height:1.7;color:#000;background:#fff;text-align:${textAlign}}
.meta{border-bottom:1px solid #ccc;padding-bottom:10pt;margin-bottom:18pt;font-family:Arial,sans-serif;font-size:9pt;color:#555}
.meta .gt{font-size:10pt;font-weight:bold;color:#111;margin-top:3pt}
.letter{white-space:pre-wrap;word-break:break-word;font-size:${FONT_SIZE_MAP[fontSize]}}
.footer{margin-top:36pt;border-top:1px solid #ddd;padding-top:8pt;font-family:Arial,sans-serif;font-size:8pt;color:#999;text-align:center}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head>
<body>
<div class="meta"><div>Generated on ${today} · Grant Compass</div><div class="gt">${safeTitle}</div></div>
<div class="letter">${esc}</div>
<div class="footer">Generated by Grant Compass · Review and edit before submission</div>
<script>window.onload=function(){window.print();window.close()};<\/script>
</body></html>`);
    pw.document.close();
  };

  /* ── Formatting dispatch ──────────────────────────────────── */

  const fmt = (fn: (ta: HTMLTextAreaElement, l: string) => string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    applyLetter(fn(ta, letter));
  };

  /* ── Derived flags ────────────────────────────────────────── */

  const canAct = !isLoading && !error && !!letter;
  const isBusy = !!rewriteAction;

  const textareaStyle: React.CSSProperties = {
    height: '380px',
    overflowY: 'scroll',
    resize: 'vertical',
    WebkitOverflowScrolling: 'touch',
    fontFamily: "Georgia, 'Times New Roman', Times, serif",
    fontSize: FONT_SIZE_MAP[fontSize],
    textAlign,
    lineHeight: '1.75',
  };

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
    >
      <div
        className="relative flex flex-col bg-white rounded-2xl shadow-2xl w-full transition-all duration-300"
        style={{ maxHeight: '92vh', maxWidth: splitView ? '1100px' : '720px' }}
      >

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <div className="min-w-0 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              Letter of Intent
            </h2>
            <span className="text-gray-200">|</span>
            <p className="text-xs text-gray-400 truncate">{grant.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canAct && (
              <button
                onClick={() => setSplitView((v) => !v)}
                title={splitView ? 'Single view' : 'Split preview'}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  splitView
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                </svg>
                {splitView ? 'Edit only' : 'Split view'}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ══ TOOLBARS (only when content is ready) ══════════ */}
        {!isLoading && !error && (
          <>
            {/* ── Row 1: tone selector + quick actions ────── */}
            <div className="flex-shrink-0 flex items-center gap-2 flex-wrap border-b border-gray-100 bg-gray-50/60 px-4 py-2">
              <label className="text-xs text-gray-500 font-medium">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={() => rewrite('tone', tone.toLowerCase())}
                disabled={isBusy}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-40 transition-colors"
              >
                {rewriteAction === 'tone' ? <Spinner /> : 'Apply Tone'}
              </button>

              <div className="h-4 w-px bg-gray-200" />

              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>

              <button
                onClick={handleCopy}
                disabled={!canAct}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-40 transition-colors"
              >
                {copyState === 'copied' ? (
                  <>
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  'Copy'
                )}
              </button>

              <button
                onClick={handlePrint}
                disabled={!canAct}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
            </div>

            {/* ── Row 2: formatting toolbar ──────────────── */}
            <div className="flex-shrink-0 flex items-center gap-0.5 flex-wrap border-b border-gray-100 px-3 py-1.5">
              {/* Bold */}
              <TBtn title="Bold — select text first" onClick={() => fmt((ta, l) => applyInlineFormat(ta, l, '**', '**'))}>
                <strong className="font-bold">B</strong>
              </TBtn>
              {/* Italic */}
              <TBtn title="Italic" onClick={() => fmt((ta, l) => applyInlineFormat(ta, l, '_', '_'))}>
                <em>I</em>
              </TBtn>
              {/* Underline */}
              <TBtn title="Underline" onClick={() => fmt((ta, l) => applyInlineFormat(ta, l, '<u>', '</u>'))}>
                <span className="underline">U</span>
              </TBtn>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              {/* Bullet list */}
              <TBtn title="Bullet list" onClick={() => fmt((ta, l) => applyLinePrefix(ta, l, () => '- '))}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </TBtn>
              {/* Numbered list */}
              <TBtn title="Numbered list" onClick={() => fmt((ta, l) => applyLinePrefix(ta, l, (i) => `${i + 1}. `))}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </TBtn>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              {/* Align buttons */}
              <TBtn title="Align left" active={textAlign === 'left'} onClick={() => setTextAlign('left')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 10h12M3 14h18M3 18h12" />
                </svg>
              </TBtn>
              <TBtn title="Align center" active={textAlign === 'center'} onClick={() => setTextAlign('center')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 10h12M3 14h18M6 18h12" />
                </svg>
              </TBtn>
              <TBtn title="Align right" active={textAlign === 'right'} onClick={() => setTextAlign('right')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 10h12M3 14h18M9 18h12" />
                </svg>
              </TBtn>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              {/* Font size */}
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as FontSize)}
                className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              {/* Undo / Redo */}
              <TBtn title="Undo last formatting or AI change (Ctrl+Z for keystrokes)" onClick={undo}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </TBtn>
              <TBtn title="Redo" onClick={redo}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </TBtn>

              <div className="flex-1" />

              {/* Version history */}
              {versions.length > 0 && (
                <div ref={versionsRef} className="relative">
                  <button
                    onClick={() => setShowVersions((v) => !v)}
                    className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {versions.length} version{versions.length > 1 ? 's' : ''}
                  </button>
                  {showVersions && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-60 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                      <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                        Version History
                      </p>
                      {versions.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setShowVersions(false);
                            if (window.confirm('Restore this version? Current text will be saved as a version first.')) {
                              applyLetter(v.content);
                            }
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <p className="text-xs font-medium text-gray-700">{v.label}</p>
                          <p className="text-xs text-gray-400">
                            {v.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ BODY ════════════════════════════════════════════ */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
              <Spinner className="h-8 w-8 text-blue-500" />
              <span className="text-sm">Claude is writing your letter…</span>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="m-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Editor */}
          {!isLoading && !error && (
            <div className="flex h-full min-h-0">

              {/* ── Left: edit + preview ──────────────────── */}
              <div className={`flex min-w-0 ${splitView ? 'flex-1' : 'flex-1'}`}>

                {/* Textarea column */}
                <div className={`flex flex-col px-4 pt-3 pb-4 ${splitView ? 'w-1/2 border-r border-gray-100' : 'flex-1'}`}>
                  <p className="text-xs text-gray-400 mb-2">✏️ Edit directly before downloading</p>
                  <textarea
                    ref={textareaRef}
                    value={letter}
                    onChange={(e) => setLetter(e.target.value)}
                    spellCheck
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                    style={textareaStyle}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span>
                      {words.toLocaleString()} words · ~{readingTime} min read
                    </span>
                    <span>{letter.length.toLocaleString()} characters</span>
                  </div>
                </div>

                {/* Preview column (split view) */}
                {splitView && (
                  <div className="w-1/2 flex flex-col px-4 pt-3 pb-4">
                    <p className="text-xs text-gray-400 mb-2 font-medium">Preview</p>
                    <div
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 overflow-y-scroll"
                      style={{
                        height: '380px',
                        fontFamily: "Georgia, 'Times New Roman', Times, serif",
                        fontSize: FONT_SIZE_MAP[fontSize],
                        textAlign,
                        lineHeight: '1.75',
                        WebkitOverflowScrolling: 'touch',
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(letter) }}
                    />
                    <p className="mt-2 text-xs text-gray-400">Rendered preview</p>
                  </div>
                )}
              </div>

              {/* ── Right: AI tools sidebar ───────────────── */}
              <div className="flex-shrink-0 w-44 border-l border-gray-100 bg-gray-50/40 flex flex-col overflow-y-auto">
                <p className="px-3 pt-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  AI Tools
                </p>

                {(
                  [
                    { action: 'formal',   label: 'Make Formal',   desc: 'Academic tone'    },
                    { action: 'shorter',  label: 'Make Shorter',  desc: 'Condense to 80%'  },
                    { action: 'stronger', label: 'Make Stronger', desc: 'More persuasive'  },
                    { action: 'grammar',  label: 'Fix Grammar',   desc: 'Errors only'      },
                  ] as const
                ).map(({ action, label, desc }) => (
                  <button
                    key={action}
                    onClick={() => rewrite(action)}
                    disabled={isBusy || !canAct}
                    className="group flex flex-col items-start gap-0.5 px-3 py-3 text-left hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-b border-gray-100 last:border-0"
                  >
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      {rewriteAction === action ? (
                        <Spinner className="h-3 w-3 text-blue-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-blue-200 group-hover:bg-blue-400 transition-colors flex-shrink-0" />
                      )}
                      {label}
                    </span>
                    <span className="text-xs text-gray-400 pl-3.5">{desc}</span>
                  </button>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <div className="flex-shrink-0 flex items-center justify-end border-t border-gray-100 px-5 py-3">
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
