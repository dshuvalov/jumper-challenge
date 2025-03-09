import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';

import theme from '../theme';
import { Providers } from '@/app/providers';
import { NotificationsProvider } from '@toolpad/core';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jumper Challenge App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <NotificationsProvider>
              <Providers>{children}</Providers>
            </NotificationsProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
