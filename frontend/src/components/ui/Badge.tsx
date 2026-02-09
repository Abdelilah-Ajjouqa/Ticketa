const variants: Record<string, string> = {
  // Reservation statuses
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  refused: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  cancelled: 'bg-light-muted/10 text-light-muted border border-light-muted/15',
  // Event statuses
  draft: 'bg-light-muted/10 text-light-muted border border-light-muted/15',
  published: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  canceled: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  // Roles
  admin: 'bg-accent/15 text-accent border border-accent/20',
  participant: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
};

export default function Badge({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  const style = variants[value] || 'bg-light-muted/10 text-light-muted border border-light-muted/15';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}
    >
      {value}
    </span>
  );
}
