import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <p className="text-6xl font-bold text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Scholarship CRM</h1>
        <p className="text-muted-foreground">Sahifa topilmadi</p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Bosh sahifa
      </Link>
    </div>
  );
}
