interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
}

export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
}: PageHeaderProps) {
  return (
    <section className="page-header">
      <div className="container page-header-inner">
        {eyebrow && (
          <span className="eyebrow">
            {eyebrow}
          </span>
        )}

        <h1>
          {title}

          {accent && (
            <span>{accent}</span>
          )}
        </h1>

        {description && (
          <p>{description}</p>
        )}
      </div>
    </section>
  );
}