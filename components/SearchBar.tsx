'use client';

import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (description: string) => void;
  isLoading: boolean;
  readOnly?: boolean;
  hideSubmit?: boolean;
}

export default function SearchBar({ value, onChange, onSearch, isLoading, readOnly, hideSubmit }: SearchBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize: reset to auto then set to scrollHeight so it grows with content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || readOnly) return;
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
        readOnly
          ? 'border-slate-200 bg-slate-50'
          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400'
      }`}>
        {/* Left: compass logo */}
        <span className="flex-shrink-0 mt-0.5 text-xl select-none" aria-hidden="true">🧭</span>

        {/* Auto-growing textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder="Describe your research in plain English..."
          rows={1}
          disabled={isLoading && !readOnly}
          className={`flex-1 text-sm leading-relaxed focus:outline-none resize-none overflow-hidden bg-transparent min-h-[1.5rem] ${
            readOnly
              ? 'text-slate-600 cursor-default'
              : 'text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:text-slate-400'
          }`}
        />

        {/* Right: search icon / spinner */}
        {!hideSubmit && (
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="flex-shrink-0 mt-0.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Search"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Submit hint */}
      {!hideSubmit && !readOnly && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
          Press Enter or click 🔍 to search
        </p>
      )}
    </form>
  );
}
