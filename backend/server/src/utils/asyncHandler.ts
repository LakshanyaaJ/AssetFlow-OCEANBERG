import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Wraps async controllers so rejections flow into the central error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
