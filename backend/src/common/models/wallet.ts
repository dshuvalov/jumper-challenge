import { z } from '@/common/utils/zod';

const walletSchema = z
  .object({
    address: z.string(),
  })
  .openapi('Wallet');
type Wallet = z.infer<typeof walletSchema>;

export { type Wallet, walletSchema };
