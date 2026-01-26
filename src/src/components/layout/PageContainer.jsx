/**
 * PageContainer Component
 * Consistent wrapper for page content
 */

export function PageContainer({ children, title, subtitle, maxWidth = 'max-w-[1800px]' }) {
  return (
    <div className={`${maxWidth} mx-auto px-4`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export default PageContainer;
