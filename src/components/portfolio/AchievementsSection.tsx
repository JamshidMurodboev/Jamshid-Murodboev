import { useLanguage } from '../../contexts/LanguageContext';

export default function AchievementsSection() {
  const { t } = useLanguage();

  return (
    <section id="achievements" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t.achievements.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">{t.achievements.subtitle}</p>
          <div className="w-16 h-1 bg-indigo-600 rounded mx-auto mt-4" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {t.achievements.stats.map((stat, i) => (
            <div
              key={i}
              className="text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900"
            >
              <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Achievement cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.achievements.cards.map((card, i) => (
            <div
              key={i}
              className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
