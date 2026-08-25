import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-ink-700 border-t-brand-500 animate-spin" />
      <p className="text-sm text-ink-300">{message}</p>
    </div>
  );
}

export function ButtonLoader() {
  return <Loader2 className="w-4 h-4 animate-spin" />;
}
