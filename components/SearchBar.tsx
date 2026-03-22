'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (description: string) => void;
  isLoading: boolean;
  readOnly?: boolean;
  hideSubmit?: boolean;
}

export default function SearchBar({ value, onChange, onSearch, isLoading, readOnly, hideSubmit }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || readOnly) return;
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <textarea
        value={value}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder="Describe your research in plain English..."
        rows={5}
        disabled={isLoading && !readOnly}
        className={`w-full rounded-lg border px-4 py-3 text-sm leading-relaxed focus:outline-none resize-none ${
          readOnly
            ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-default'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
        }`}
      />

      {!hideSubmit && (
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="self-end flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isLoading ? 'Searching...' : 'Find Grants'}
        </button>
      )}
    </form>
  );
}
