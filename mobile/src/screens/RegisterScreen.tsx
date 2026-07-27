import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { ApiError } from "../lib/api";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { InkStamp } from "../components/ui/InkStamp";
import { RouteIcon } from "../icons";
import "./AuthScreens.css";

export function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel criar sua conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-cover">
        <InkStamp variant="success" size={64} rotate={-7} label="NOVO EXPLORADOR">
          <RouteIcon size={22} />
        </InkStamp>
        <h1 className="auth-cover__title">
          Trilha
          <br />
          Local
        </h1>
        <p className="auth-cover__tagline">comece hoje seu proprio caderno de viagem</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <span className="auth-form__tab">nova pagina</span>
        <h2 className="auth-form__title">Criar conta</h2>

        <TextField
          label="seu nome"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
          required
        />
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
          label="crie uma senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimo 6 caracteres"
          minLength={6}
          required
        />

        {error ? <p className="auth-form__error">{error}</p> : null}

        <Button type="submit" fullWidth loading={loading}>
          Criar conta
        </Button>

        <p className="auth-form__footer">
          Ja tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
