import { AuthenticationStatus } from '@rainbow-me/rainbowkit';
import { createContext, useContext } from 'react';

type AuthenticationConfig = {
  status: AuthenticationStatus;
};

export const AuthenticationContext = createContext<AuthenticationConfig | null>(null);

export function useAuthenticationStatus() {
  const contextValue = useContext(AuthenticationContext);

  return contextValue?.status ?? null;
}
