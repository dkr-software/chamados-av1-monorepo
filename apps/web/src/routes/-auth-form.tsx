import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginAccount, registerAccount, saveAuthSession } from "../lib/auth";
import { createAuthFormSchema } from "../lib/form-schemas";
import { sectors } from "../lib/sectors";

type AuthMode = "login" | "cadastro";
type AuthFormValues = { name: string; email: string; sector: string; phone: string; password: string };

function AuthFrame({ mode, children }: { mode: AuthMode; children: ReactNode }) {
  const isRegistration = mode === "cadastro";

  return (
    <div className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="workspace-mark" aria-hidden="true">a.</span>
          <div>
            <span className="workspace-label">CENTRAL DE SERVIÇOS</span>
            <span className="auth-brand-name">atende</span>
          </div>
        </div>
        <header className="auth-heading">
          <p className="section-kicker">{isRegistration ? "CADASTRO DE SOLICITANTE" : "ACESSO À CENTRAL"}</p>
          <h1 id="auth-title">{isRegistration ? "Crie sua conta." : "Boas-vindas."}</h1>
          <p>{isRegistration ? "Cadastre-se para abrir e acompanhar seus chamados." : "Entre com sua conta para acompanhar seus chamados."}</p>
        </header>
        {children}
      </section>
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegistration = mode === "cadastro";
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthFormSchema(isRegistration)),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", sector: "", phone: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    setNotice("");
    try {
      const login = isRegistration
        ? await registerAccount({
            nome: values.name,
            email: values.email,
            setor: values.sector,
            telefone: values.phone,
            senha: values.password,
          })
        : await loginAccount(values.email, values.password);
      saveAuthSession(login);
      await navigate({ to: "/" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível entrar.");
    }
  });

  return (
    <AuthFrame mode={mode}>
      <form className="auth-form" aria-busy={isSubmitting} noValidate onSubmit={submit}>
        {isRegistration && <label className="field auth-field" htmlFor="auth-name">
          Nome completo
          <input
            autoComplete="name"
            id="auth-name"
            type="text"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "auth-name-error" : undefined}
          />
          {errors.name?.message && <span className="auth-field-error" id="auth-name-error">{errors.name.message}</span>}
        </label>}

        <label className="field auth-field" htmlFor="auth-email">
          E-mail
          <input
            autoComplete="email"
            id="auth-email"
            type="email"
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
          />
          {errors.email?.message && <span className="auth-field-error" id="auth-email-error">{errors.email.message}</span>}
        </label>

        {isRegistration && <>
          <label className="field auth-field" htmlFor="auth-sector">
            Setor
            <select
              id="auth-sector"
              {...register("sector")}
              aria-invalid={Boolean(errors.sector)}
              aria-describedby={errors.sector ? "auth-sector-error" : undefined}
            >
              <option value="" disabled>Selecione um setor</option>
              {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
            </select>
            {errors.sector?.message && <span className="auth-field-error" id="auth-sector-error">{errors.sector.message}</span>}
          </label>
          <label className="field auth-field" htmlFor="auth-phone">
            Telefone
            <input
              autoComplete="tel"
              id="auth-phone"
              type="tel"
              {...register("phone")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "auth-phone-error" : undefined}
            />
            {errors.phone?.message && <span className="auth-field-error" id="auth-phone-error">{errors.phone.message}</span>}
          </label>
        </>}

        <label className="field auth-field" htmlFor="auth-password">
          Senha
          <input
            autoComplete={isRegistration ? "new-password" : "current-password"}
            id="auth-password"
            type="password"
            {...register("password")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "auth-password-error" : undefined}
          />
          {errors.password?.message && <span className="auth-field-error" id="auth-password-error">{errors.password.message}</span>}
        </label>

        {notice && <p className="auth-message is-error" role="alert">{notice}</p>}

        <div className="auth-actions">
          <button className="primary-button full-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? (isRegistration ? "Criando conta..." : "Entrando...") : (isRegistration ? "Criar conta" : "Entrar")}
          </button>
          <Link className="quiet-button auth-switch" to={isRegistration ? "/login" : "/cadastro"}>
            {isRegistration ? "Já tenho uma conta" : "Criar conta"}
          </Link>
        </div>
      </form>

      {!isRegistration && <a
        className="auth-forgot"
        href="#recuperacao"
        onClick={(event) => {
          event.preventDefault();
          setNotice("A recuperação de senha ainda não está conectada.");
        }}
      >
        Esqueci minha senha
      </a>}
    </AuthFrame>
  );
}
