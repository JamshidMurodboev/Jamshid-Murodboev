import { useLanguage } from '../../contexts/LanguageContext';

export default function JourneySection() {
  const { t } = useLanguage();

  return (
    <section id="journey" className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t.journey.title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">{t.journey.subtitle}</p>
          <div className="w-16 h-1 bg-indigo-600 rounded mx-auto mt-4" />
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-800 transform sm:-translate-x-1/2" />

          <div className="space-y-12">
            {t.journey.events.map((event, i) => (
              <div
                key={i}
                className={`relative flex items-start gap-6 sm:gap-0 ${
                  i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}
              >
                {/* Content card */}
                <div
                  className={`ml-16 sm:ml-0 w-full sm:w-5/12 ${
                    i % 2 === 0 ? 'sm:pr-10 sm:text-right' : 'sm:pl-10 sm:text-left'
                  }`}
                >
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all">
                    <span className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full mb-3">
                      {event.year}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {event.flag} {event.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="absolute left-3 sm:left-1/2 sm:-translate-x-1/2 w-7 h-7 rounded-full bg-indigo-600 dark:bg-indigo-500 border-4 border-white dark:border-slate-950 shadow-lg flex items-center justify-center z-10 mt-6">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Spacer on opposite side */}
                <div className="hidden sm:block sm:w-5/12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
