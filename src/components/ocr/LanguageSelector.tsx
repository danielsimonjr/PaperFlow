/**
 * Language Selector Component
 * Provides language selection for OCR with search and popular languages.
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { SUPPORTED_LANGUAGES } from '@/lib/ocr/types';
import { useOCRStore } from '@/stores/ocrStore';
import { cn } from '@/utils/cn';

const POPULAR_LANGUAGE_CODES = ['eng', 'spa', 'fra', 'deu', 'chi_sim', 'jpn', 'kor', 'ara', 'rus', 'por'];

export function LanguageSelector() {
  const { language, setLanguage } = useOCRStore();
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!search) return SUPPORTED_LANGUAGES;
    const lower = search.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(lower) ||
        lang.code.toLowerCase().includes(lower)
    );
  }, [search]);

  const popularLanguages = SUPPORTED_LANGUAGES.filter((lang) =>
    POPULAR_LANGUAGE_CODES.includes(lang.code)
  );

  const selectedLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Recognition Language</label>

      {/* Popular languages as quick buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Popular languages">
        {popularLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            type="button"
            className={cn(
              'px-3 py-1 rounded-full text-sm border transition-colors',
              language === lang.code
                ? 'bg-primary-500 text-white border-primary-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
            )}
            aria-pressed={language === lang.code}
          >
            {lang.name}
          </button>
        ))}
      </div>

      {/* Search for other languages */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search other languages..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="pl-10"
          aria-label="Search languages"
          aria-expanded={isDropdownOpen}
          aria-controls="language-dropdown"
        />
      </div>

      {/* Language dropdown */}
      {isDropdownOpen && search && (
        <div
          id="language-dropdown"
          className="max-h-48 overflow-y-auto border rounded-md bg-white dark:bg-gray-900 shadow-lg"
          role="listbox"
          aria-label="Available languages"
        >
          {filteredLanguages.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No languages found</div>
          ) : (
            filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setSearch('');
                  setIsDropdownOpen(false);
                }}
                type="button"
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center',
                  language === lang.code && 'bg-primary-50 dark:bg-primary-900/20'
                )}
                role="option"
                aria-selected={language === lang.code}
              >
                <span>{lang.name}</span>
                <span className="text-gray-500 text-sm">{lang.code}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Current selection */}
      {selectedLanguage && !search && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selected: <span className="font-medium">{selectedLanguage.name}</span>
        </div>
      )}
    </div>
  );
}
