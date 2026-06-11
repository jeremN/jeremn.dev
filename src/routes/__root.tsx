import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Eyebrow } from '../components/site/Eyebrow'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Jérémie Néhlil' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

const NAV = [
  { to: '/blog', label: 'Writing' },
  { to: '/cv', label: 'CV' },
  { to: '/freelance', label: 'Freelance' },
] as const

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased [overflow-wrap:anywhere]">
        <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            to="/"
            className="font-grotesk text-lg font-extrabold tracking-tight text-ink no-underline"
          >
            jeremn<span className="text-accent">.</span>dev
          </Link>
          <nav className="flex gap-7">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="group no-underline">
                <Eyebrow className="transition-colors group-hover:text-accent">
                  {n.label}
                </Eyebrow>
              </Link>
            ))}
          </nav>
        </header>

        {children}

        <footer className="relative z-10 bg-ground">
          <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
            <Eyebrow>Get in touch</Eyebrow>
            <Link to="/freelance" className="block no-underline">
              <h2 className="mt-3 font-display text-5xl font-semibold leading-none tracking-tight text-ink transition-colors hover:text-accent sm:text-7xl">
                Work with me
              </h2>
            </Link>
            <p className="mt-8 font-mono text-xs text-muted">
              © {new Date().getFullYear()} Jérémie Néhlil — jeremn.dev
            </p>
          </div>
        </footer>

        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
