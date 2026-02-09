interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

const colors: Record<string, string> = {
  indigo: 'bg-accent/15 text-accent',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-400',
  rose: 'bg-rose-500/15 text-rose-400',
  violet: 'bg-violet-500/15 text-violet-400',
};

export default function StatsCard({ title, value, icon, trend, color = 'indigo' }: StatsCardProps) {
  return (
    <div className="bg-dark-secondary rounded-xl border border-border-strong p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-light-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-light">{value}</p>
          {trend && <p className="mt-1 text-xs text-light-muted/60">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color] || colors.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
