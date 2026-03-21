'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, profile: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !profile.trim()) return;
    onSearch(query.trim(), profile.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <label htmlFor="query" className="text-sm font-medium text-gray-700">
          Research Keywords
        </label>
        <input
          id="query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., machine learning, cancer immunotherapy, climate change..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="profile" className="text-sm font-medium text-gray-700">
          Researcher Profile
        </label>
        <textarea
          id="profile"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder="Describe your research background, institution, expertise, and goals..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !query.trim() || !profile.trim()}
        className="self-end rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Searching...' : 'Find Grants'}
      </button>
    </form>
  );
}
