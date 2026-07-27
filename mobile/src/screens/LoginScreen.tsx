import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import "./AuthScreens.css";

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
    <div className="auth-screen">
      <div className="auth-cover">
        <h1 className="auth-cover__title">TuriStar</h1>
        <p className="auth-cover__tagline">um caderno de bordo para suas aventuras</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <span className="auth-form__tab">pagina de entrada</span>
        <h2 className="auth-form__title">Entrar</h2>

        <TextField
          label="seu e-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          required
        />
        <TextField
          label="sua senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          required
        />

        {error ? <p className="auth-form__error">{error}</p> : null}

        <Button type="submit" fullWidth loading={loading}>
          Entrar
        </Button>

        <p className="auth-form__footer">
          Ainda nao tem conta? <Link to="/register">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
