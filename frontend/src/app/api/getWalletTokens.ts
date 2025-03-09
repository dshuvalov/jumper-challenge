import { API_URL, defaultFetchConfig } from '@/config';
import { notifications } from '@/components/GlobalComponents';

export async function getWalletTokens(
  walletAddress: string,
  options?: { tokensPageKey?: string }
): Promise<{
  address: string;
  tokens: Array<{ name: string; balance: string; symbol: string }>;
  tokensPageKey?: string;
}> {
  const url = new URL(API_URL + `/wallets/${walletAddress}/tokens`);
  url.searchParams.append('tokensPageKey', options?.tokensPageKey || '');
  const response = await fetch(url, defaultFetchConfig);

  if (response.ok) {
    const json = await response.json();
    return json.responseObject;
  }

  notifications.show('Error during fetching tokens. Please try again later.', {
    severity: 'error',
    autoHideDuration: 5000,
  });

  return { address: walletAddress, tokens: [], tokensPageKey: '' };
}
