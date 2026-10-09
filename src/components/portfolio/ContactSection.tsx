import { ExternalLink, Mail } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ContactSection() {
  const { t } = useLanguage();

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 dark:from-indigo-900 dark:via-indigo-800 dark:to-purple-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {t.contact.title}
        </h2>
        <p className="text-indigo-200 text-lg mb-12 max-w-lg mx-auto">
          {t.contact.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://www.instagram.com/jamshid.bilan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            📸 {t.contact.instagramHandle}
            <ExternalLink size={16} />
          </a>

          <a
            href="mailto:jamshid.murodboev.edu@gmail.com"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 hover:scale-105 transition-all"
          >
            <Mail size={20} />
            {t.contact.email}
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
          {['🇺🇿', '🇹🇷', '🇪🇺'].map((flag, i) => (
            <div key={i} className="text-4xl opacity-60 hover:opacity-100 transition-opacity cursor-default">
              {flag}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
