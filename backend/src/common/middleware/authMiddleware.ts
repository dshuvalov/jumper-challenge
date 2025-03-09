import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiResponseConfig } from '@/common/models/openAPIResponseConfig';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { getSession } from '@/common/models/session';
import { handleServiceResponse } from '@/common/utils/httpHandlers';

const PUBLIC_ROUTES = ['/auth/nonce', '/auth/verify', '/health-check']; // Exact public routes
const PUBLIC_ROUTE_PREFIXES = ['/swagger/']; // Any route starting with these prefixes should be public

const unauthorizedResponseObjectSchema = z.object({
  authorized: z.boolean(),
});
type UnauthorizedResponseObject = z.infer<typeof unauthorizedResponseObjectSchema>;

export const unauthorizedResponseConfig: ApiResponseConfig = {
  schema: unauthorizedResponseObjectSchema,
  statusCode: StatusCodes.UNAUTHORIZED,
  description: 'Unauthorized',
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  // Check if the request path is in the list of public routes
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next(); // Skip authentication
  }

  // Check if the request path starts with any of the public route prefixes
  if (PUBLIC_ROUTE_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }

  const session = await getSession(req, res);

  if (!session.walletAddress) {
    const responseObject: UnauthorizedResponseObject = { authorized: false };
    const serviceResponse = new ServiceResponse(
      ResponseStatus.Failed,
      'Unauthorized',
      responseObject,
      StatusCodes.UNAUTHORIZED
    );
    return handleServiceResponse(serviceResponse, res);
  }
  next();
};
