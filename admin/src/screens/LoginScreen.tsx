import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";
import "./LoginScreen.css";

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-cover">
        <div className="login-cover__mark">
          <Compass size={26} strokeWidth={2} />
        </div>
        <h1 className="login-cover__title">
          Trilha
          <br />
          Local
        </h1>
        <p className="login-cover__tagline">
          painel administrativo — gerencie atrativos, conquistas e acompanhe as visitas registradas
          pelos turistas da sua organizacao.
        </p>
        <div className="login-cover__index">
          <span>01 · atrativos</span>
          <span>02 · conquistas</span>
          <span>03 · indicadores</span>
        </div>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <span className="login-form__eyebrow">acesso restrito</span>
        <h2 className="login-form__title">Entrar</h2>
        <p className="login-form__hint">Use a conta administrativa da sua organizacao.</p>

        <div className="field">
          <label htmlFor="email">e-mail</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@suaorganizacao.com.br"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">senha</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="sua senha"
            required
          />
        </div>

        {error ? <p className="banner banner--error">{error}</p> : null}

        <button className="btn btn--primary" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "entrando..." : "Entrar"}
        </button>

        <p className="login-form__footer">
          Novas organizacoes sao cadastradas pela equipe da plataforma.
        </p>
      </form>
    </div>
  );
}
