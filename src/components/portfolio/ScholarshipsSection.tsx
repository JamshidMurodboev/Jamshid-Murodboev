import { useLanguage } from '../../contexts/LanguageContext';

const SCHOLARSHIPS = [
  { flag: '🇹🇷', name: 'Turkiya Burslari', org: 'Turkiya Hukumati', type: 'To\'liq' },
  { flag: '🇹🇷', name: 'Turkiya Diyanet Burslari', org: 'Diyanet (Turkiya)', type: 'To\'liq' },
  { flag: '🇭🇺', name: 'Vengriya Davlati Granti', org: 'Vengriya Hukumati', type: 'To\'liq' },
  { flag: '🇷🇴', name: 'Ruminiya Davlati Granti', org: 'Ruminiya Hukumati', type: 'To\'liq' },
  { flag: '🌍', name: 'Arab Davlatlari Grantlari', org: 'Arab Universitetlari', type: 'To\'liq' },
  { flag: '🇸🇦', name: "Saudiya Arabistoni To'liq Granti", org: 'Saudiya Arabistoni', type: 'To\'liq' },
];

const SECTION_LABELS: Record<string, { title: string; subtitle: string }> = {
  uz: {
    title: 'Grantlar va Stipendiyalar',
    subtitle: "Men yo'naltiruvchi grantlar ro'yxati",
  },
  en: {
    title: 'Scholarships & Grants',
    subtitle: 'Scholarships I help students apply for',
  },
  ru: {
    title: 'Гранты и стипендии',
    subtitle: 'Стипендии, в которые я помогаю поступить',
  },
  tr: {
    title: 'Burslar & Hibeler',
    subtitle: 'Öğrencilerin başvurmasına yardımcı olduğum burslar',
  },
};

const FULL_LABELS: Record<string, string> = {
  uz: "To'liq",
  en: 'Full',
  ru: 'Полная',
  tr: 'Tam',
};

export default function ScholarshipsSection() {
  const { language } = useLanguage();
  const labels = SECTION_LABELS[language] ?? SECTION_LABELS.en;
  const fullLabel = FULL_LABELS[language] ?? FULL_LABELS.en;

  return (
    <section id="scholarships" className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {labels.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">{labels.subtitle}</p>
          <div className="w-16 h-1 bg-indigo-600 rounded mx-auto mt-4" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SCHOLARSHIPS.map((s, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="text-4xl flex-shrink-0">{s.flag}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {s.name}
                  </h3>
                  <span className="flex-shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    🎓 {fullLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{s.org}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
