'use client';

import '@rainbow-me/rainbowkit/styles.css';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  AuthenticationStatus,
  createAuthenticationAdapter,
  getDefaultConfig,
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import { API_URL, defaultFetchConfig } from '@/config';
import { createSiweMessage } from 'viem/siwe';
import { AuthenticationContext } from '@/components/AuthenticationContext/AuthenticationContext';
import GlobalComponents from '@/components/GlobalComponents';

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: 'Jumper Challenge App',
  appDescription: 'Jumper Challenge App',
  appUrl: 'https://jumper.challenge',
  //   https://github.com/lifinance/widget/blob/main/packages/widget/src/config/walletConnect.ts
  projectId: '5432e3507d41270bee46b7b85bbc2ef8',
  chains: [mainnet],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const fetchingStatusRef = useRef(false);
  const verifyingRef = useRef(false);
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>('loading');

  // Fetch user when:
  useEffect(() => {
    const fetchStatus = async () => {
      if (fetchingStatusRef.current || verifyingRef.current) {
        return;
      }

      fetchingStatusRef.current = true;

      try {
        const response = await fetch(API_URL + '/auth/me', defaultFetchConfig);
        const json = await response.json();
        setAuthStatus(json.responseObject.walletAddress ? 'authenticated' : 'unauthenticated');
      } catch (_error) {
        setAuthStatus('unauthenticated');
      } finally {
        fetchingStatusRef.current = false;
      }
    };

    // 1. page loads
    fetchStatus();

    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', fetchStatus);
    return () => window.removeEventListener('focus', fetchStatus);
  }, []);

  const authAdapter = useMemo(() => {
    return createAuthenticationAdapter({
      getNonce: async () => {
        const response = await fetch(API_URL + '/auth/nonce', {
          ...defaultFetchConfig,
        });
        const { responseObject } = await response.json();

        return responseObject.nonce;
      },

      createMessage: ({ nonce, address, chainId }) => {
        return createSiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in with Ethereum to the app.',
          uri: window.location.origin,
          version: '1',
          chainId,
          nonce,
        });
      },

      verify: async ({ message, signature }) => {
        verifyingRef.current = true;

        try {
          const response = await fetch(API_URL + '/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
            ...defaultFetchConfig,
          });
          const authenticated = Boolean(response.ok);

          if (authenticated) {
            setAuthStatus(authenticated ? 'authenticated' : 'unauthenticated');
          }

          return authenticated;
        } catch (error) {
          console.error('Error verifying signature', error);
          return false;
        } finally {
          verifyingRef.current = false;
        }
      },

      signOut: async () => {
        setAuthStatus('unauthenticated');
        await fetch(API_URL + '/auth/logout', { ...defaultFetchConfig, method: 'POST' });
      },
    });
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider adapter={authAdapter} status={authStatus}>
          <RainbowKitProvider>
            <AuthenticationContext.Provider value={{ status: authStatus }}>
              <GlobalComponents />
              {children}
            </AuthenticationContext.Provider>
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
