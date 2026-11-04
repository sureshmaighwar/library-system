export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">{children}</div>
    </main>
  );
}
