'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardPaste, Eraser, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EXAMPLE_QUERIES } from '@/lib/constants';
import { tokenizeSql } from '@/lib/syntaxHighlight';
import type { ClauseType } from '@/types/sql';
import { cn } from '@/lib/utils';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  errorMessage?: string;
  onExample: (sql: string) => void;
  activeClause: ClauseType | null;
}

export default function QueryInput({
  value,
  onChange,
  isValid,
  errorMessage,
  onExample,
}: QueryInputProps) {
  const t = useTranslations('input');
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLocalValue(value), [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLocalValue(text);
      onChange(text);
    } catch {}
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      onChange(localValue);
    }
  };

  const tokens = tokenizeSql(localValue);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#30363D] bg-[#161B22] px-3 text-xs font-medium text-[#E6EDF3] hover:bg-[#21262D] sm:flex-none">
            <BookOpen className="h-3.5 w-3.5 text-[#00D4AA]" />
            {t('examples')}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-sm">
            {EXAMPLE_QUERIES.map((ex) => (
              <DropdownMenuItem key={ex.label} onClick={() => onExample(ex.sql)}>
                {ex.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePaste}
          className="h-8 gap-1.5 border-[#30363D] bg-[#161B22] text-xs hover:bg-[#21262D]"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          {t('paste')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="h-8 gap-1.5 border-[#30363D] bg-[#161B22] text-xs hover:bg-[#21262D]"
        >
          <Eraser className="h-3.5 w-3.5" />
          {t('clear')}
        </Button>
      </div>

      <div className="relative min-h-[240px] flex-1 xl:min-h-0">
        <div
          ref={overlayRef}
          aria-hidden
          className="sql-mono pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-transparent bg-[#0D1117] px-4 py-3 text-sm"
        >
          {tokens.map((token, i) => (
            <span key={i} style={{ color: token.color ?? '#E6EDF3' }}>
              {token.text}
            </span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          spellCheck={false}
          className={cn(
            'sql-mono absolute inset-0 z-10 w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-sm text-transparent caret-[#E6EDF3] outline-none focus:ring-2 focus:ring-[#00D4AA]/40',
            isValid ? 'border-[#30363D]' : 'border-red-500/60'
          )}
        />
        <div className="absolute bottom-2 right-3 z-20 rounded bg-[#0D1117]/80 px-1.5 py-0.5 font-mono text-[10px] text-[#8B949E]">
          {t('charCount', { count: localValue.length })}
        </div>
      </div>

      <p className="text-[11px] text-[#8B949E]">{t('hint')}</p>

      {!isValid && errorMessage && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
