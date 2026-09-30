import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

function RootLayout() {
  return (
    <>
      <a className="skip-link" href="#main">Pular para o conteúdo</a>
      <main id="main"><Outlet /></main>
      <footer className="app-footer"><Link to="/">Atende · Central de serviços</Link><span>Central de atendimento</span></footer>
    </>
  );
}

export const Route = createRootRoute({ component: RootLayout });
