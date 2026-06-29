import Hero from '../components/Hero'
import Features from '../components/Features'
import How from '../components/How'
import Tiers from '../components/Tiers'
import Branches from '../components/Branches'
import ComboPackages from '../components/ComboPackages'
import IndividualServices from '../components/IndividualServices'
import PublicPromotions from '../components/PublicPromotions'

export default function HomePage() {
    return (
        <main className="home-shell">
            <div className="home-backdrop" aria-hidden="true" />
            <Hero />
            <How />
            <Features />
            <ComboPackages />
            <IndividualServices />
            <PublicPromotions />
            <Branches />
            <Tiers />
        </main>
    )
}
