import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

function RootLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Atende — início">
            <span className="brand-mark" aria-hidden="true">
              a.
            </span>
            <span className="brand-name">atende</span>
          </Link>
          <nav className="site-nav" aria-label="Navegação principal">
            <Link to="/" className="nav-link" activeOptions={{ exact: true }}>
              Início
            </Link>
            <Link to="/about" className="nav-link">
              Sobre
            </Link>
          </nav>
          <span className="header-note">CENTRAL DE SERVIÇOS</span>
        </div>
      </header>
      <main id="main" className="main-shell">
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>Atende <span aria-hidden="true">·</span> Central de serviços</span>
        <span className="footer-status"><span aria-hidden="true" /> Feito para ajudar</span>
      </footer>
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })
