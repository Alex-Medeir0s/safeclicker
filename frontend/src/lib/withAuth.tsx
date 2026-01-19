import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import api from "@/services/api";

export function withAuth(Component: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Verificar sessão chamando /me
          const response = await api.get("/users/me");
          setIsAuthenticated(true);
        } catch (error) {
          // Se não autenticado, redirecionar para login
          router.push("/");
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Carregando...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }
    return <Component {...props} />;
  };
}
