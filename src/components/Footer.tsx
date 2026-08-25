import { Moon, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-700/50 bg-ink-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Moon className="w-4 h-4 text-ink-950" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <span className="block text-white font-display font-bold text-sm">
                Hostel Late Night Mart
              </span>
              <span className="block text-[10px] text-ink-400 mt-0.5">
                Late Night Hunger? We've Got You Covered.
              </span>
            </div>
          </div>
          <p className="text-xs text-ink-400 flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-brand-500 fill-brand-500" /> for hostel students
          </p>
        </div>
      </div>
    </footer>
  );
}
