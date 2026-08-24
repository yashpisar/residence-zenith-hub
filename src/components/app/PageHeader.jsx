export function PageHeader({ icon: Icon, title, description, actions }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-[image:var(--gradient-surface)] shadow-[var(--shadow-card)]">
          <Icon className="size-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
