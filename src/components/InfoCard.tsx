import React from 'react';
import { CheckCircle2, LucideIcon } from 'lucide-react';
import { SpotlightCard } from './reactbits/SpotlightCard';

type Tint = 'indigo' | 'purple' | 'pink' | 'amber';

const tints: Record<Tint, { icon: string; label: string; spot: string }> = {
  indigo: {
    icon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    label: 'text-indigo-400',
    spot: 'rgba(80, 70, 228, 0.18)',
  },
  purple: {
    icon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    label: 'text-purple-400',
    spot: 'rgba(147, 130, 255, 0.18)',
  },
  pink: {
    icon: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    label: 'text-pink-400',
    spot: 'rgba(236, 72, 153, 0.18)',
  },
  amber: {
    icon: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    label: 'text-amber-400',
    spot: 'rgba(245, 158, 11, 0.18)',
  },
};

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  footer: string;
  tint?: Tint;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  label,
  title,
  body,
  footer,
  tint = 'indigo',
}) => {
  const t = tints[tint];
  return (
    <SpotlightCard spotlightColor={t.spot} className="p-6 flex flex-col justify-between group">
      <div>
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 group-hover:scale-105 transition-transform ${t.icon}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.label}`}>{label}</span>
        <h3 className="text-base font-semibold text-white mt-1 mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">{body}</p>
      </div>
      <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{footer}</span>
      </div>
    </SpotlightCard>
  );
};
