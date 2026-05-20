import Hero from '../components/Hero'
import Features from '../components/Features'
import How from '../components/How'
import Tiers from '../components/Tiers'

export default function HomePage() {
    return (
        <main className="home-shell">
            <div className="home-backdrop" aria-hidden="true" />
            <Hero />
            <How/>
            <Features />
            <Tiers />
        </main>
    )
}
