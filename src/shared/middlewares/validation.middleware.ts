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
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (parsed.params) {
        Object.defineProperty(req, 'params', {
          value: parsed.params,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
