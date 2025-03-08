import { Request, Response } from 'express';
import { getIronSession } from 'iron-session';
import { SiweMessage } from 'viem/siwe';

import { env } from '@/common/utils/envConfig';

const AUTH_SECRET = env.AUTH_SECRET;

type Session = {
  nonce?: string;
  siwe?: SiweMessage;
  walletAddress?: string;
};

const SESSION_TTL_SECONDS = env.SESSION_TTL_MINUTES * 60;

export function getSession(req: Request, res: Response) {
  return getIronSession<Session>(req, res, {
    password: AUTH_SECRET,
    cookieName: 'session',
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      sameSite: 'None',
      partitioned: 'true',
    },
  });
}
