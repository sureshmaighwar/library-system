import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-indigo-600 px-12 py-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/15">
            <BookOpen className="size-5" />
          </span>
          <span className="text-sm font-semibold">Library</span>
        </div>
        <div className="grid max-w-md gap-4">
          <h2 className="text-4xl font-semibold tracking-tight">Find a book and take it home.</h2>
          <p className="text-lg text-indigo-100">
            Members browse the shelf. Librarians watch stock, loans, and overdue fines.
          </p>
        </div>
        <p className="text-sm text-indigo-100">Up to three open loans. $0.50 for each late day.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">{children}</div>
      </section>
    </main>
  );
}
