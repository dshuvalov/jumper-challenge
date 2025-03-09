import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { TokenBalanceType } from 'alchemy-sdk';
import { TokenBalance } from 'alchemy-sdk/dist/src/types/types';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createApiResponses } from '@/api-docs/openAPIResponseBuilders';
import { unauthorizedResponseConfig } from '@/common/middleware/authMiddleware';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { getSession } from '@/common/models/session';
import { Wallet } from '@/common/models/wallet';
import { Token, WalletTokens, walletTokensSchema } from '@/common/models/wallet-tokens';
import { alchemySdk } from '@/common/third-parties/alchemy/alchemy-sdk';
import { handleServiceResponse } from '@/common/utils/httpHandlers';
import { z } from '@/common/utils/zod';

export const walletRegistry = new OpenAPIRegistry();

export const walletsRouter = (() => {
  const router = express.Router();

  const walletTokensResponseObjectSchema = walletTokensSchema.extend({
    tokensPageKey: z.string().optional(),
  });
  type WalletTokensResponseObject = z.infer<typeof walletTokensResponseObjectSchema>;

  async function getWalletTokens(
    walletAddress: string,
    options?: { tokensPageKey?: string }
  ): Promise<WalletTokensResponseObject> {
    try {
      const tokenBalances = await alchemySdk.core.getTokenBalances(walletAddress, {
        type: TokenBalanceType.ERC20,
        pageKey: options?.tokensPageKey,
      });

      const processTokenMetadata = async (token: TokenBalance) => {
        // Get metadata of token
        const metadata = await alchemySdk.core.getTokenMetadata(token.contractAddress);

        // Get balance of token
        let balance = Number(token.tokenBalance);
        const decimals = metadata.decimals ?? 0;

        balance = balance / Math.pow(10, decimals);
        const balanceFixed = balance.toFixed(2);

        return {
          name: metadata.name || 'Unspecified name',
          balance: balanceFixed,
          symbol: metadata.symbol || 'Unspecified symbol',
        };
      };

      const processedTokens = await Promise.allSettled(tokenBalances.tokenBalances.map(processTokenMetadata)).then(
        (tokenPromises) =>
          tokenPromises.reduce<Token[]>((accum, promise) => {
            if (promise.status === 'fulfilled') {
              accum.push(promise.value);
            } else {
              console.error(promise.reason);
            }
            return accum;
          }, [])
      );

      return {
        address: walletAddress,
        tokens: processedTokens,
        tokensPageKey: tokenBalances.pageKey,
      };
    } catch (error) {
      // TODO: make better error handling, error from alchemy or wallet not found
      console.error(error);
      return { address: walletAddress, tokens: [] };
    }
  }

  const GetWalletTokensRequestParams = z.object({
    walletAddress: z.string(),
  });
  type GetWalletTokensRequestParams = z.infer<typeof GetWalletTokensRequestParams>;

  const GetWalletTokensQuery = z
    .object({
      tokensPageKey: z.string(),
    })
    .partial();
  type GetWalletTokensQuery = z.infer<typeof GetWalletTokensQuery>;

  walletRegistry.registerPath({
    method: 'get',
    path: '/wallets/me/tokens',
    tags: ['Wallets'],
    description: 'Fetch ERC20 token balances associated with the authorized Ethereum address',
    request: {
      query: GetWalletTokensQuery,
    },
    responses: createApiResponses([
      { schema: walletTokensResponseObjectSchema, statusCode: StatusCodes.OK, description: 'Success' },
      unauthorizedResponseConfig,
      { schema: z.null(), statusCode: StatusCodes.NOT_FOUND, description: 'Not Found' },
    ]),
  });
  router.get(
    '/me/tokens',
    async (
      req: Request<NonNullable<unknown>, WalletTokensResponseObject, NonNullable<unknown>, GetWalletTokensQuery>,
      res: Response<WalletTokensResponseObject>
    ) => {
      const session = await getSession(req, res);

      const walletAddress = session.walletAddress!;

      const serviceResponse = new ServiceResponse(ResponseStatus.Success, 'Success', { walletAddress }, StatusCodes.OK);
      handleServiceResponse(serviceResponse, res);
      return;
    }
  );

  walletRegistry.registerPath({
    method: 'get',
    path: '/wallets/{walletAddress}/tokens',
    tags: ['Wallets'],
    description: 'Fetch ERC20 token balances associated with the provided Ethereum address',
    request: {
      params: GetWalletTokensRequestParams,
      query: GetWalletTokensQuery,
    },
    responses: createApiResponses([
      { schema: walletTokensResponseObjectSchema, statusCode: StatusCodes.OK, description: 'Success' },
      unauthorizedResponseConfig,
      { schema: z.null(), statusCode: StatusCodes.NOT_FOUND, description: 'Not Found' },
    ]),
  });
  router.get(
    '/:walletAddress/tokens',
    async (
      req: Request<GetWalletTokensRequestParams, WalletTokens, NonNullable<unknown>, GetWalletTokensQuery>,
      res: Response<Wallet>
    ) => {
      const walletAddress = req.params.walletAddress;
      const tokensPageKey = req.query.tokensPageKey;

      const wallet = await getWalletTokens(walletAddress, { tokensPageKey });

      if (wallet) {
        const serviceResponse = new ServiceResponse<WalletTokens>(
          ResponseStatus.Success,
          'Success',
          wallet,
          StatusCodes.OK
        );
        handleServiceResponse(serviceResponse, res);
        return;
      }

      const serviceResponse = new ServiceResponse(
        ResponseStatus.Failed,
        'Wallet Not Found',
        null,
        StatusCodes.NOT_FOUND
      );
      handleServiceResponse(serviceResponse, res);
    }
  );

  return router;
})();
