import { StatusCodes } from 'http-status-codes';

import { z } from '@/common/utils/zod';

export type ApiResponseConfig = {
  schema: z.ZodTypeAny;
  description: string;
  statusCode: StatusCodes;
};
