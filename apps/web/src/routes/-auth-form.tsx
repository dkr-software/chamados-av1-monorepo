import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { loginAccount, saveAuthSession } from "../lib/auth";

type AuthMode = "login" | "cadastro";
type FieldName = "email" | "password";
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;

const emptyValues: FormValues = { email: "", password: "" };

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
          <p className="section-kicker">{isRegistration ? "ACESSO POR CONVITE" : "ACESSO À CENTRAL"}</p>
          <h1 id="auth-title">{isRegistration ? "Solicitar acesso" : "Boas-vindas."}</h1>
          <p>{isRegistration ? "Contas comuns são criadas pelo administrador do sistema." : "Entre com sua conta para acompanhar seus chamados."}</p>
        </header>
        {children}
      </section>
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegistration = mode === "cadastro";
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Informe um e-mail válido.";
    }
    if (!values.password) {
      nextErrors.password = "Informe sua senha.";
    }

    setErrors(nextErrors);
    setNotice("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const login = await loginAccount(values.email, values.password);
      saveAuthSession(login);
      await navigate({ to: "/" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistration) {
    return (
      <AuthFrame mode={mode}>
        <div className="auth-restricted">
          <p>Peça ao administrador para criar sua conta e informar seu acesso.</p>
          <Link className="primary-button full-button" to="/login">Voltar para login</Link>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame mode={mode}>
      <form className="auth-form" aria-busy={isSubmitting} noValidate onSubmit={submit}>
        <label className="field auth-field" htmlFor="auth-email">
          E-mail
          <input
            autoComplete="email"
            id="auth-email"
            name="email"
            type="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            onChange={(event) => updateField("email", event.target.value)}
          />
          {errors.email && <span className="auth-field-error" id="auth-email-error">{errors.email}</span>}
        </label>

        <label className="field auth-field" htmlFor="auth-password">
          Senha
          <input
            autoComplete="current-password"
            id="auth-password"
            name="password"
            type="password"
            value={values.password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "auth-password-error" : undefined}
            onChange={(event) => updateField("password", event.target.value)}
          />
          {errors.password && <span className="auth-field-error" id="auth-password-error">{errors.password}</span>}
        </label>

        {notice && <p className="auth-message is-error" role="alert">{notice}</p>}

        <div className="auth-actions">
          <button className="primary-button full-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
          <Link className="quiet-button auth-switch" to="/cadastro">Solicitar acesso</Link>
        </div>
      </form>

      <a
        className="auth-forgot"
        href="#recuperacao"
        onClick={(event) => {
          event.preventDefault();
          setNotice("A recuperação de senha ainda não está conectada.");
        }}
      >
        Esqueci minha senha
      </a>
    </AuthFrame>
  );
}