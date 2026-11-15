import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function useAuthStatus() {
  const { identity, loginStatus, isAuthenticated } = useInternetIdentity();

  return {
    isAuthenticated,
    isLoggingIn: loginStatus === "logging-in",
    isInitializing: loginStatus === "initializing",
    identity,
  };
}
