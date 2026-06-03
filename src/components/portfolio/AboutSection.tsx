import { useLanguage } from '../../contexts/LanguageContext';

const LANGUAGES = [
  { name: "O'zbek", flag: '🇺🇿', level: 100 },
  { name: 'English', flag: '🇬🇧', level: 85 },
  { name: 'Türkçe', flag: '🇹🇷', level: 70 },
  { name: 'Русский', flag: '🇷🇺', level: 65 },
];

export default function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t.about.title}
          </h2>
          <div className="w-16 h-1 bg-indigo-600 rounded mx-auto" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Bio */}
          <div className="space-y-5">
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              {t.about.bio1}
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              {t.about.bio2}
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              {t.about.bio3}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {t.about.nationality}
                </p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  🇺🇿 {t.about.nationalityValue}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {t.about.education}
                </p>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">
                  🏆 {t.about.educationValue}
                </p>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {t.about.languages}
            </h3>
            <div className="space-y-5">
              {LANGUAGES.map(lang => (
                <div key={lang.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {lang.flag} {lang.name}
                    </span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">{lang.level}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${lang.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Countries visited */}
            <div className="mt-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                🌍 Countries
              </h3>
              <div className="flex flex-wrap gap-3">
                {['🇺🇿 Uzbekistan', '🇹🇷 Turkey', '🇫🇮 Finland', '🇭🇺 Hungary'].map(c => (
                  <span
                    key={c}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
