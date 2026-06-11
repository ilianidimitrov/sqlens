'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Link2, Download, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSql } from '@/lib/sqlFormatter';
import { cn } from '@/lib/utils';

interface ExportPanelProps {
  query: string;
  isValid: boolean;
  compact?: boolean;
}

export default function ExportPanel({ query, isValid, compact = false }: ExportPanelProps) {
  const t = useTranslations('export');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch {}
  };

  const handleShare = async () => {
    const encoded = btoa(query);
    const url = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
    await copyText(url, t('linkCopied'));
  };

  const handleDownloadPng = async () => {
    const element = document.getElementById('sqlens-diagram');
    if (!element) return;

    try {
      const domtoimage = await import('dom-to-image-more');
      const dataUrl = await domtoimage.toPng(element, {
        bgcolor: '#0D1117',
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = 'sqlens-diagram.png';
      link.href = dataUrl;
      link.click();
    } catch {}
  };

  const actions = [
    { label: t('copy'), icon: Copy, onClick: () => copyText(query, t('copied')) },
    {
      label: t('copyFormatted'),
      icon: AlignLeft,
      onClick: () => copyText(formatSql(query), t('copied')),
    },
    { label: t('share'), icon: Link2, onClick: handleShare },
    { label: t('download'), icon: Download, onClick: handleDownloadPng },
  ];

  return (
    <div className="relative">
      <div
        className={cn(
          compact
            ? 'flex flex-wrap items-center gap-1.5'
            : 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              size={compact ? 'sm' : 'sm'}
              disabled={!isValid}
              onClick={action.onClick}
              className={cn(
                'gap-1.5 border-[#30363D] bg-[#161B22] text-[#8B949E] hover:bg-[#21262D] hover:text-[#E6EDF3]',
                compact && 'h-8 px-2.5 text-xs'
              )}
              title={action.label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className={compact ? 'hidden md:inline' : undefined}>{action.label}</span>
            </Button>
          );
        })}
      </div>
      {toast && (
        <div className="absolute -top-10 right-0 rounded bg-[#00D4AA] px-3 py-1 text-xs font-medium text-black">
          {toast}
        </div>
      )}
    </div>
  );
}
