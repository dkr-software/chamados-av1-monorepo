import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="page home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> ATENDIMENTO INTERNO</p>
          <h1 id="home-title">Menos tempo procurando.<br /><em>Mais tempo resolvendo.</em></h1>
          <p className="hero-description">
            Um lugar simples para pedir ajuda, acompanhar cada etapa e voltar ao que importa.
          </p>
          <Link className="text-link" to="/about">
            Conheça a central <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="flow-visual" aria-label="Etapas de atendimento: solicitação, análise e resolução">
          <div className="flow-heading">
            <span>DO PEDIDO À RESPOSTA</span>
            <span className="flow-count">01 — 03</span>
          </div>
          <ol className="flow-list">
            <li className="flow-step is-current">
              <span className="step-index">01</span>
              <span className="step-copy"><strong>Você solicita</strong><small>Conte o que precisa</small></span>
              <span className="step-marker" aria-hidden="true">✓</span>
            </li>
            <li className="flow-step">
              <span className="step-index">02</span>
              <span className="step-copy"><strong>A equipe analisa</strong><small>O pedido chega ao time certo</small></span>
              <span className="step-marker" aria-hidden="true">→</span>
            </li>
            <li className="flow-step">
              <span className="step-index">03</span>
              <span className="step-copy"><strong>Você acompanha</strong><small>Veja as atualizações em um só lugar</small></span>
              <span className="step-marker" aria-hidden="true">○</span>
            </li>
          </ol>
          <div className="flow-footnote"><span /> CLARO EM CADA ETAPA</div>
        </div>
      </section>

      <section className="service-section" aria-labelledby="service-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">COMO PODEMOS AJUDAR</p>
            <h2 id="service-title">Um caminho para cada necessidade.</h2>
          </div>
          <p className="section-note">As solicitações ficam organizadas para que nada se perca no caminho.</p>
        </div>
        <ul className="service-list">
          <li><span className="service-number">01</span><span className="service-name">Suporte técnico</span><span className="service-arrow" aria-hidden="true">↗</span></li>
          <li><span className="service-number">02</span><span className="service-name">Infraestrutura</span><span className="service-arrow" aria-hidden="true">↗</span></li>
          <li><span className="service-number">03</span><span className="service-name">Acesso e sistemas</span><span className="service-arrow" aria-hidden="true">↗</span></li>
        </ul>
        <p className="service-caption">Escolha o assunto ao abrir seu chamado. A equipe responsável recebe as informações necessárias desde o início.</p>
      </section>

      <section className="closing-line" aria-label="Acompanhe suas solicitações">
        <p>Um pedido de cada vez.<br /><span>Uma resposta mais clara.</span></p>
        <Link className="round-link" to="/about" aria-label="Saiba mais sobre a central">↗</Link>
      </section>
    </div>
  )
}
