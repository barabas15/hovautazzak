export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bg-nav/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-muted">
        <span>
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
            RandomUtazás
          </span>{" "}
          — fedezd fel a világot véletlenszerűen.
        </span>
        <span>Budapestről (BUD) bárhová · MVP</span>
      </div>
    </footer>
  );
}
