export function Eyebrow({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={`eyebrow ${className}`}>{children}</span>
}
