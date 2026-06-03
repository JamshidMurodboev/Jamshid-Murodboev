import { ArrowDown, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-900"
    >
      {/* Decorative blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-300/20 dark:bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating flags */}
      <div className="absolute top-1/3 left-8 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.2s' }}>🇺🇿</div>
      <div className="absolute top-1/4 right-12 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.8s' }}>🇹🇷</div>
      <div className="absolute bottom-1/3 left-16 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '1.4s' }}>🇫🇮</div>
      <div className="absolute bottom-1/4 right-8 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>🇭🇺</div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Avatar placeholder */}
        <div className="mx-auto mb-8 w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-2xl ring-4 ring-white dark:ring-slate-800">
          👨‍🎓
        </div>

        <p className="text-indigo-600 dark:text-indigo-400 font-medium text-lg mb-2 tracking-wide">
          {t.hero.greeting}
        </p>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
          {t.hero.name}
        </h1>

        <p className="text-xl sm:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {t.hero.tagline}
        </p>

        <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg mb-10 max-w-xl mx-auto">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#about"
            className="inline-flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
          >
            {t.hero.cta}
            <ArrowDown size={16} />
          </a>
          <a
            href="https://www.instagram.com/jamshid.bilan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-semibold rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all hover:scale-105"
          >
            📸 @jamshid.bilan
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
          <div className="w-5 h-8 border-2 border-slate-300 dark:border-slate-600 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
