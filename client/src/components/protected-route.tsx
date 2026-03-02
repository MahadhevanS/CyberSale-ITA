import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { TerminalSquare } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary space-y-4">
        <TerminalSquare className="w-12 h-12 animate-pulse" />
        <p className="font-mono tracking-widest uppercase text-sm">Verifying Credentials...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
