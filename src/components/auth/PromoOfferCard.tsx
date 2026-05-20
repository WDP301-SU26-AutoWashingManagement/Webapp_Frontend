import type { LucideIcon } from 'lucide-react'
import type { AuthOfferAccent } from '../../constants/authPromo'

interface PromoOfferCardProps {
  icon: LucideIcon
  title: string
  description: string
  tag: string
  tagClass: string
  accent: AuthOfferAccent
  className?: string
}

export default function PromoOfferCard({
  icon: Icon,
  title,
  description,
  tag,
  tagClass,
  accent,
  className = '',
}: PromoOfferCardProps) {
  return (
    <div
      className={`flex gap-4 rounded-xl border p-4 backdrop-blur-md ${accent.card} ${className}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${accent.icon}`}
      >
        <Icon size={20} className={accent.iconColor} strokeWidth={2.25} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug text-white drop-shadow-sm">{title}</h3>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagClass}`}
          >
            {tag}
          </span>
        </div>
        <p className={`mt-1.5 text-xs font-medium leading-relaxed ${accent.description}`}>{description}</p>
      </div>
    </div>
  )
}
