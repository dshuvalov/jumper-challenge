import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { generateSiweNonce, parseSiweMessage, SiweMessage } from 'viem/siwe';
import { z } from 'zod';

import { createApiResponse, createApiResponses } from '@/api-docs/openAPIResponseBuilders';
import { unauthorizedResponseConfig } from '@/common/middleware/authMiddleware';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { getSession } from '@/common/models/session';
import { viemClient } from '@/common/third-parties/viem/viemClient';
import { handleServiceResponse } from '@/common/utils/httpHandlers';

export const authRegistry = new OpenAPIRegistry();

export const authRouter = (() => {
  const router = express.Router();

  const authMeSuccessResponseObjectSchema = z.object({
    walletAddress: z.string(),
  });
  type AuthMeSuccessResponseObject = z.infer<typeof authMeSuccessResponseObjectSchema>;

  authRegistry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Auth'],
    responses: createApiResponses([
      { schema: authMeSuccessResponseObjectSchema, statusCode: StatusCodes.OK, description: 'Success' },
      unauthorizedResponseConfig,
    ]),
  });
  router.get('/me', async (req: Request, res: Response) => {
    const session = await getSession(req, res);

    if (session.walletAddress) {
      const responseObject: AuthMeSuccessResponseObject = { walletAddress: session.walletAddress };
      const serviceResponse = new ServiceResponse(
        ResponseStatus.Success,
        'Wallet defined',
        responseObject,
        StatusCodes.OK
      );
      handleServiceResponse(serviceResponse, res);
      return;
    }

    // Fallback if session not found
    const serviceResponse = new ServiceResponse(
      ResponseStatus.Failed,
      'Unprocessable entity error message',
      null,
      StatusCodes.UNPROCESSABLE_ENTITY
    );
    handleServiceResponse(serviceResponse, res);
  });

  const nonceResponseObjectSchema = z.object({
    nonce: z.string(),
  });
  type NonceResponseObject = z.infer<typeof nonceResponseObjectSchema>;
  authRegistry.registerPath({
    method: 'get',
    path: '/auth/nonce',
    tags: ['Auth'],
    responses: createApiResponse(nonceResponseObjectSchema, 'Success'),
  });
  router.get('/nonce', async (req: Request, res: Response) => {
    const session = await getSession(req, res);

    const nonce = generateSiweNonce();
    session.nonce = nonce;
    await session.save();

    const responseObject: NonceResponseObject = { nonce };

    const serviceResponse = new ServiceResponse(
      ResponseStatus.Success,
      'Nonce created',
      responseObject,
      StatusCodes.OK
    );
    handleServiceResponse(serviceResponse, res);
  });

  const verifyResponseObjectSchema = z.object({
    ok: z.boolean(),
  });
  type VerifyResponseObject = z.infer<typeof verifyResponseObjectSchema>;
  authRegistry.registerPath({
    method: 'post',
    path: '/auth/verify',
    tags: ['Auth'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
              signature: {
                type: 'string',
              },
            },
            required: ['message', 'signature'],
          },
        },
      },
    },
    responses: {
      ...createApiResponse(verifyResponseObjectSchema, 'Success'),
      ...createApiResponse(z.null(), 'Unprocessable entity error message', StatusCodes.UNPROCESSABLE_ENTITY),
    },
  });
  router.post('/verify', async (req: Request, res: Response) => {
    const { message, signature } = req.body;
    const siweMessage = parseSiweMessage(message) as SiweMessage;

    const success = await viemClient.verifyMessage({
      address: siweMessage.address,
      message,
      signature,
    });

    if (!success) {
      const serviceResponse = new ServiceResponse(
        ResponseStatus.Failed,
        'SiweMessage verification failed',
        null,
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      handleServiceResponse(serviceResponse, res);
      return;
    }

    const session = await getSession(req, res);

    if (siweMessage.nonce !== session.nonce) {
      const serviceResponse = new ServiceResponse(
        ResponseStatus.Failed,
        'Invalid nonce',
        null,
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      handleServiceResponse(serviceResponse, res);
      return;
    }

    session.siwe = siweMessage;
    session.walletAddress = siweMessage.address;
    await session.save();

    const responseObject: VerifyResponseObject = { ok: true };
    const serviceResponse = new ServiceResponse<VerifyResponseObject>(
      ResponseStatus.Success,
      'Successfully verified',
      responseObject,
      StatusCodes.OK
    );
    handleServiceResponse(serviceResponse, res);
  });

  const logoutResponseObjectSchema = z.object({
    ok: z.boolean(),
  });
  type LogoutResponseObject = z.infer<typeof logoutResponseObjectSchema>;
  authRegistry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    responses: createApiResponses([
      { schema: logoutResponseObjectSchema, statusCode: StatusCodes.OK, description: 'Success' },
      unauthorizedResponseConfig,
    ]),
  });
  router.post('/logout', async (req: Request, res: Response<ServiceResponse<LogoutResponseObject>>) => {
    const session = await getSession(req, res);
    session.destroy();

    const responseObject: LogoutResponseObject = { ok: true };
    const serviceResponse = new ServiceResponse<LogoutResponseObject>(
      ResponseStatus.Success,
      'Logout succeeded',
      responseObject,
      StatusCodes.OK
    );
    handleServiceResponse(serviceResponse, res);
  });

  return router;
})();
