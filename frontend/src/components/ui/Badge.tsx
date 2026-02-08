const variants: Record<string, string> = {
  // Reservation statuses
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  refused: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-600',
  // Event statuses
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-rose-100 text-rose-800',
  // Roles
  admin: 'bg-violet-100 text-violet-800',
  participant: 'bg-blue-100 text-blue-800',
};

export default function Badge({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  const style = variants[value] || 'bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style} ${className}`}
    >
      {value}
    </span>
  );
}
