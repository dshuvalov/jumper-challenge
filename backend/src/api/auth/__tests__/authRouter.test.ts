import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { Address } from 'viem';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';
import { Mock } from 'vitest';

import { getSession } from '@/common/models/session';
import { viemClient } from '@/common/third-parties/viem/viemClient';
import { app } from '@/server';

// Mock dependencies
vi.mock('@/common/third-parties/viem/viemClient', () => ({
  viemClient: {
    verifyMessage: vi.fn(),
  },
}));

vi.mock('@/common/models/session', () => ({
  getSession: vi.fn(),
}));

describe('Auth API Endpoints', () => {
  let validNonce: string;
  let testWalletAddress: Address;
  let testSignature: string;

  beforeAll(() => {
    validNonce = 'validnonce';
    testWalletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    testSignature = '0xvalidsignature';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createTestSiweMessage() {
    return createSiweMessage({
      nonce: validNonce,
      address: testWalletAddress,
      chainId: 1,
      domain: 'localhost:3000',
      uri: 'http://localhost:3000',
      version: '1',
    });
  }

  // Test /auth/me
  it('GET /auth/me - should return wallet address if session exists', async () => {
    (getSession as Mock).mockResolvedValue({ walletAddress: testWalletAddress });

    const response = await request(app).get('/auth/me');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body.responseObject.walletAddress).toBe(testWalletAddress);
  });

  it('GET /auth/me - should return 422 if session does not exist', async () => {
    (getSession as Mock).mockResolvedValue({});

    const response = await request(app).get('/auth/me');

    expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.message).toBe('Unprocessable entity error message');
  });

  // Test /auth/nonce
  it('GET /auth/nonce - should return a generated nonce', async () => {
    const mockSession = { save: vi.fn() };
    (getSession as Mock).mockResolvedValue(mockSession);

    const response = await request(app).get('/auth/nonce');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body.responseObject.nonce).toBeDefined();
  });

  // Test /auth/verify
  it('POST /auth/verify - should verify a valid SIWE message', async () => {
    const siweMessage = createTestSiweMessage();
    (viemClient.verifyMessage as Mock).mockResolvedValue(true);

    const mockSession = { nonce: validNonce, save: vi.fn() };
    (getSession as Mock).mockResolvedValue(mockSession);

    const response = await request(app).post('/auth/verify').send({
      message: siweMessage,
      signature: testSignature,
    });

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body.responseObject.ok).toBe(true);
  });

  it('POST /auth/verify - should fail if SIWE verification fails', async () => {
    const siweMessage = createTestSiweMessage();

    (viemClient.verifyMessage as Mock).mockResolvedValue(false);

    const response = await request(app).post('/auth/verify').send({
      message: siweMessage,
      signature: '0xinvalidsignature',
    });

    expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.message).toBe('SiweMessage verification failed');
  });

  it('POST /auth/verify - should fail if nonce mismatch', async () => {
    const siweMessage = createTestSiweMessage();

    (viemClient.verifyMessage as Mock).mockResolvedValue(true);

    const mockSession = { nonce: 'differentNonce', save: vi.fn() };
    (getSession as Mock).mockResolvedValue(mockSession);

    const response = await request(app).post('/auth/verify').send({
      message: siweMessage,
      signature: testSignature,
    });

    expect(response.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(response.body.message).toBe('Invalid nonce');
  });

  // Test /auth/logout
  it('POST /auth/logout - should destroy session and return success', async () => {
    const mockSession = { destroy: vi.fn() };
    (getSession as Mock).mockResolvedValue(mockSession);

    const response = await request(app).post('/auth/logout');

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body.responseObject.ok).toBe(true);
    expect(mockSession.destroy).toHaveBeenCalled();
  });
});
