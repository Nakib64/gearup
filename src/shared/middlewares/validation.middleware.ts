import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as any;
      
      // Assign back parsed values in case there are transforms/defaults
      req.body = parsed.body ?? req.body;
      if (parsed.query) {
        req.query = parsed.query as any;
      }
      if (parsed.params) {
        req.params = parsed.params as any;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
