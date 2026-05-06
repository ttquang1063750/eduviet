import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/app-error.js';
import { LoginInput } from './auth.schema.js';
import { AuthUser } from '@eduviet/shared-types';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await this.app.prisma.user.findUnique({
      where: { email: input.email, deletedAt: null },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      schoolId: user.schoolId,
    };

    const accessToken = this.app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m' }
    );

    const refreshToken = this.app.jwt.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d', key: process.env['JWT_REFRESH_SECRET'] }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.app.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    await this.app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resourceType: 'AUTH',
        ipAddress,
      },
    });

    return { accessToken, refreshToken, user: authUser };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = this.app.jwt.verify(refreshToken, { key: process.env['JWT_REFRESH_SECRET'] }) as { sub: string };
    } catch {
      throw AppError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const storedToken = await this.app.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token đã bị thu hồi hoặc hết hạn');
    }

    if (storedToken.userId !== payload.sub) {
      throw AppError.unauthorized('Refresh token không hợp lệ');
    }

    // Rotate: revoke old, issue new
    await this.app.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = storedToken.user;
    const accessToken = this.app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m' }
    );

    const newRefreshToken = this.app.jwt.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d', key: process.env['JWT_REFRESH_SECRET'] }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.app.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
        userAgent: storedToken.userAgent,
        ipAddress: storedToken.ipAddress,
      },
    });

    return { accessToken, newRefreshToken };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.app.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.app.prisma.auditLog.create({
      data: { userId, action: 'USER_LOGOUT', resourceType: 'AUTH' },
    });
  }

  getCookieName() {
    return REFRESH_TOKEN_COOKIE;
  }
}
