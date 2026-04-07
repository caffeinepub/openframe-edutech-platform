import type { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseInternetIdentityReturn {
  identity: Identity | null;
  isInitializing: boolean;
  isLoggingIn: boolean;
  isLoginError: boolean;
  loginError: Error | null;
  login: () => void;
  clear: () => void;
}

export function useInternetIdentity(): UseInternetIdentityReturn {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoginError, setIsLoginError] = useState(false);
  const [loginError, setLoginError] = useState<Error | null>(null);
  const clientRef = useRef<AuthClient | null>(null);

  useEffect(() => {
    let active = true;
    AuthClient.create().then((client) => {
      if (!active) return;
      clientRef.current = client;
      const id = client.getIdentity();
      const principal = id.getPrincipal();
      if (!principal.isAnonymous()) {
        setIdentity(id);
      }
      setIsInitializing(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(() => {
    if (!clientRef.current) return;
    setIsLoggingIn(true);
    setIsLoginError(false);
    setLoginError(null);

    const identityProviderUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai"
        : "https://identity.ic0.app";

    clientRef.current.login({
      identityProvider: identityProviderUrl,
      onSuccess: () => {
        const id = clientRef.current!.getIdentity();
        setIdentity(id);
        setIsLoggingIn(false);
      },
      onError: (err) => {
        setIsLoginError(true);
        setLoginError(new Error(err ?? "Login failed"));
        setIsLoggingIn(false);
      },
    });
  }, []);

  const clear = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.logout();
    }
    setIdentity(null);
    setIsLoginError(false);
    setLoginError(null);
    setIsLoggingIn(false);
  }, []);

  return {
    identity,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
    login,
    clear,
  };
}
