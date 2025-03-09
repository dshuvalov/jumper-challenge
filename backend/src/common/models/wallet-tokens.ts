import { walletSchema } from '@/common/models/wallet';
import { z } from '@/common/utils/zod';

const tokenSchema = z
  .object({
    name: z.string(),
    balance: z.string(),
    symbol: z.string(),
  })
  .openapi('Token');
type Token = z.infer<typeof tokenSchema>;

const walletTokensSchema = walletSchema
  .extend({
    tokens: z.array(tokenSchema),
  })
  .openapi('WalletTokens');
type WalletTokens = z.infer<typeof walletTokensSchema>;

export { type WalletTokens, walletTokensSchema, tokenSchema, Token };
