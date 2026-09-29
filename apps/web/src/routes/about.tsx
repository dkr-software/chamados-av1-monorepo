import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  return (
    <div className="page about-page">
      <section className="about-intro" aria-labelledby="about-title">
        <p className="eyebrow"><span className="eyebrow-dot" /> SOBRE A CENTRAL</p>
        <h1 id="about-title">Resolver bem começa por <em>ouvir com clareza.</em></h1>
        <p className="about-lede">
          O Atende organiza solicitações de serviço para aproximar quem precisa de ajuda das equipes que podem resolver.
        </p>
      </section>

      <section className="about-story" aria-labelledby="story-title">
        <div className="story-label">
          <span className="story-index">01 / 02</span>
          <span className="eyebrow">NOSSO JEITO DE ATENDER</span>
        </div>
        <div className="story-content">
          <h2 id="story-title">Cada pedido tem contexto.<br />Cada resposta tem um próximo passo.</h2>
          <p>
            Em vez de espalhar conversas por vários canais, reunimos o assunto, as atualizações e o histórico do chamado em um só lugar. Assim, fica mais fácil saber o que já aconteceu e o que vem depois.
          </p>
          <Link className="text-link" to="/">
            Voltar ao início <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="principles" aria-label="Princípios do atendimento">
        <div><span>01</span><h3>Organização</h3><p>O pedido chega com assunto e detalhes claros.</p></div>
        <div><span>02</span><h3>Acompanhamento</h3><p>As etapas ficam visíveis para quem solicitou.</p></div>
        <div><span>03</span><h3>Continuidade</h3><p>O histórico ajuda a equipe a seguir do ponto certo.</p></div>
      </section>
    </div>
  )
}
