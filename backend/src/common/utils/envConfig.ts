import dotenv from 'dotenv';
import { cleanEnv, EnvError, host, makeValidator, num, port, str, testOnly } from 'envalid';

dotenv.config({ path: ['.env', '.env.local'] });

const sessionTTLValidator = makeValidator<number>((input) => {
  const parsedValue = parseInt(input, 10);
  if (Number.isNaN(parsedValue)) {
    throw new EnvError(`Invalid integer input: "${input}"`);
  } else if (parsedValue < 5) {
    throw new EnvError(`Session TTL must be at least 5 minutes`);
  }

  return parsedValue;
});

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ devDefault: testOnly('test'), choices: ['development', 'production', 'test'] }),
  HOST: host({ devDefault: testOnly('localhost') }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str({ devDefault: testOnly('http://localhost:3000') }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  AUTH_SECRET: str({ devDefault: testOnly('secret') }),
  SESSION_TTL_MINUTES: sessionTTLValidator({ devDefault: testOnly(5) }),
  ALCHEMY_API_KEY: str({ devDefault: testOnly('key') }),
});
