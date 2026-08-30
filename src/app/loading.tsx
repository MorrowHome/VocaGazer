export default function Loading() {
  return (
    <main className="min-h-screen relative">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-4">
        <div className="h-8 w-40 rounded-xl bg-white/60 animate-pulse" />
        <div className="h-28 rounded-2xl bg-white/60 animate-pulse" />
        <div className="h-28 rounded-2xl bg-white/60 animate-pulse" />
        <div className="h-48 rounded-2xl bg-white/60 animate-pulse" />
      </div>
    </main>
  );
}
