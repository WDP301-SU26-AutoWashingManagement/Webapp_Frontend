import { AUTH_OFFERS } from '../../constants/authPromo'
import PromoOfferCard from './PromoOfferCard'

export default function FloatingPromoOffers() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 -left-12 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-[35%] right-[12%] h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[28%] right-[20%] h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-8 h-48 w-48 rounded-full border border-cyan-400/15" />

      {AUTH_OFFERS.map((offer) => (
        <PromoOfferCard
          key={offer.title}
          {...offer}
          className={`pointer-events-none absolute opacity-[0.88] ${offer.position ?? ''}`}
        />
      ))}
    </div>
  )
}
