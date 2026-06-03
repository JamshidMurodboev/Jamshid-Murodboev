import Navbar from '../components/portfolio/Navbar';
import HeroSection from '../components/portfolio/HeroSection';
import AboutSection from '../components/portfolio/AboutSection';
import JourneySection from '../components/portfolio/JourneySection';
import AchievementsSection from '../components/portfolio/AchievementsSection';
import ContactSection from '../components/portfolio/ContactSection';
import Footer from '../components/portfolio/Footer';

export default function PortfolioPage() {
  return (
    <div className="font-sans">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <JourneySection />
      <AchievementsSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
