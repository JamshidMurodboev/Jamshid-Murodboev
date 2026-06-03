import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="py-8 bg-slate-900 dark:bg-slate-950 text-center">
      <p className="text-slate-400 text-sm">
        {t.footer.made} — Jamshid Murodboev © {new Date().getFullYear()}. {t.footer.rights}.
      </p>
    </footer>
  );
}
