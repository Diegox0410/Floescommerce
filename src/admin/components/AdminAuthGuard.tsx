import { useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";

import {
  isOwnerUser,
  observeAuth,
} from "../../services/firebase/authService";

import { AdminLogin } from "./AdminLogin";

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({
  children,
}: AdminAuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = observeAuth((currentUser) => {
      setUser(currentUser);
      setReady(true);
    });

    return unsubscribe;
  }, []);

  if (!ready) {
    return (
      <div className="admin-auth">
        <div className="admin-auth-card">
          <span className="eyebrow">FLOES ADMIN</span>
          <h1>Verificando acceso...</h1>
        </div>
      </div>
    );
  }

  if (!isOwnerUser(user)) {
    return <AdminLogin />;
  }

  return <>{children}</>;
}