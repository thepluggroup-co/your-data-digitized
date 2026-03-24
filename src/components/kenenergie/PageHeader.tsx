interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {badge && (
          <span className="text-xs font-semibold bg-accent/15 text-accent px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
