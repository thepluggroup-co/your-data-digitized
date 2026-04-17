interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1.5">
        {/* Accent bar */}
        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-accent to-accent/40 flex-shrink-0" />
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {badge && (
          <span className="badge-shine text-xs font-semibold bg-accent/12 text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground ml-4">{subtitle}</p>
      )}
    </div>
  );
}
