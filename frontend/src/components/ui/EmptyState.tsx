import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {icon || <InboxIcon className="h-12 w-12 text-light-muted/30" />}
      </div>
      <h3 className="text-sm font-medium text-light">{title}</h3>
      {description && <p className="mt-1 text-sm text-light-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
