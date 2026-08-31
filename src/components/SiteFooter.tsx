export function SiteFooter() {
  return (
    <footer className="border-t border-kawaii-border/40 mt-4">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-xs text-kawaii-muted font-medium">
        <p className="font-display text-sm tracking-widest text-kawaii-text/70">VOCALOID Music Hub</p>
        <nav className="flex flex-wrap gap-4">
          <a href="/ranking" className="hover:text-kawaii-pink">排行榜</a>
          <a href="/analytics" className="hover:text-kawaii-pink">数据分析</a>
          <a href="/forum" className="hover:text-kawaii-pink">论坛</a>
          <a href="/about" className="hover:text-kawaii-pink">关于</a>
        </nav>
      </div>
    </footer>
  );
}
