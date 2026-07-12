import { Request, Response } from 'express';
import { isProd } from '../../config/env';
import { ok } from '../../utils/response';
import { AuthResult, authService } from './auth.service';

const REFRESH_COOKIE = 'assetflow_refresh';

function sendAuthResult(res: Response, result: AuthResult) {
  // Refresh token travels only as an httpOnly cookie — invisible to JS (XSS-safe).
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/v1/auth',
    expires: result.refreshExpiresAt,
  });
  ok(res, { accessToken: result.accessToken, user: result.user });
}

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body as { email: string; password: string };
    sendAuthResult(res, await authService.login(email, password, req.ip));
  },

  async refresh(req: Request, res: Response) {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE] ?? '';
    sendAuthResult(res, await authService.refresh(token));
  },

  async logout(req: Request, res: Response) {
    const token = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE];
    await authService.logout(token, req.user?.id, req.ip);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    ok(res, { message: 'Logged out' });
  },

  async me(req: Request, res: Response) {
    ok(res, await authService.me(req.user!.id));
  },
};
