import { useState, type FormEvent } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { loginOwner } from "../../services/firebase/authService";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await loginOwner(email, password);
    } catch {
      setError("Correo, contraseña o permisos incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth">
      <div className="admin-auth-card">
        <div className="admin-auth-icon" aria-hidden="true">
          <LockKeyhole size={26} />
        </div>

        <span className="eyebrow">DGNG ADMIN</span>

        <h1>Acceso administrativo</h1>

        <p>
          Inicia sesión con la cuenta autorizada para administrar DGNG Store.
        </p>

        <form onSubmit={handleSubmit} className="admin-auth-form">
          <label>
            <span>Correo electrónico</span>

            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </label>

          <label>
            <span>Contraseña</span>

            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </label>

          {error && (
            <div className="admin-auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-button admin-button-primary admin-auth-submit"
            disabled={loading}
          >
            <LogIn size={17} />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}