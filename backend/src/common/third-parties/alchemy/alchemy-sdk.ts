import { Alchemy, Network } from 'alchemy-sdk';

import { env } from '@/common/utils/envConfig';

const config = {
  apiKey: env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemySdk = new Alchemy(config);

export { alchemySdk };
