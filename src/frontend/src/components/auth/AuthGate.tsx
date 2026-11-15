import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import LoginButton from "./LoginButton";

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGate({ children, fallback }: AuthGateProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Please log in to access this feature.</span>
              <LoginButton />
            </AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
}
