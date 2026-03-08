/**
 * MobilePageContainer Component
 * Simple content wrapper with mobile padding
 */

export function MobilePageContainer({ children, noPadding = false }) {
  return (
    <div className={noPadding ? '' : 'px-4 py-3'}>
      {children}
    </div>
  );
}
