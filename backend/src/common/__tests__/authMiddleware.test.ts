import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { Address } from 'viem';
import { expect, Mock } from 'vitest';

import { getSession } from '@/common/models/session';
import { app } from '@/server';

// Mock dependencies
vi.mock('@/common/models/session', () => ({
  getSession: vi.fn(),
}));

describe('Auth Middleware', () => {
  let testWalletAddress: Address;

  beforeAll(() => {
    testWalletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip authentication in test environment', async () => {
    (getSession as Mock).mockResolvedValue({ walletAddress: testWalletAddress });

    const response = await request(app).get('/auth/me');

    expect(response.statusCode).toBe(StatusCodes.OK);
  });

  it('should allow public routes without authentication', async () => {
    process.env.NODE_ENV = 'production';
    const mockSession = { save: vi.fn() };
    (getSession as Mock).mockResolvedValue(mockSession);

    const response = await request(app).get('/auth/nonce');
    expect(response.statusCode).toBe(StatusCodes.OK);
  });

  it('should allow routes with public prefixes without authentication', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app).get('/swagger/swagger.json');
    expect(response.statusCode).toBe(StatusCodes.OK);
  });

  it('should deny access to protected routes without a valid session', async () => {
    process.env.NODE_ENV = 'production';

    (getSession as Mock).mockResolvedValue({});

    const response = await request(app).get('/auth/me');

    expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED);
  });
  it('should allow access to protected routes without a valid session', async () => {
    process.env.NODE_ENV = 'production';

    (getSession as Mock).mockResolvedValue({ walletAddress: testWalletAddress });

    const response = await request(app).get('/auth/me');

    expect(response.statusCode).toBe(StatusCodes.OK);
  });
});
