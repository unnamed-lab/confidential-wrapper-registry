export function ComingSoon({ title, day }: { title: string; day: string }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-white/50">Landing on the build schedule ({day}).</p>
    </section>
  );
}
