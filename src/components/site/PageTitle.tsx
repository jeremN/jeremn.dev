import { Eyebrow } from './Eyebrow'

export function PageTitle({
  eyebrow,
  children,
}: {
  eyebrow?: string
  children: React.ReactNode
}) {
  return (
    <header className="mb-16 pt-8">
      {eyebrow && <Eyebrow className="mb-4 block">{eyebrow}</Eyebrow>}
      <h1 className="font-display text-6xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-8xl">
        {children}
      </h1>
    </header>
  )
}
