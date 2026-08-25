import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-ink-700/50 flex items-center justify-center text-ink-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}
