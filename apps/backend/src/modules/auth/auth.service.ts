import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/app-error.js';
import { LoginInput, RegisterInput } from './auth.schema.js';
import { AuthUser } from '@eduviet/shared-types';
import { emailQueue } from '@eduviet/redis';
import { UsersRepository } from '../users/users.repository.js';
import { Role } from '@prisma/client';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

export class AuthService {
  private readonly usersRepo: UsersRepository;

  constructor(private readonly app: FastifyInstance) {
    this.usersRepo = new UsersRepository(app.prisma);
  }

  async register(input: RegisterInput, ipAddress?: string) {
    const existingUser = await this.usersRepo.findByEmail(input.email);

    if (existingUser) {
      throw AppError.conflict('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.usersRepo.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      role: 'STUDENT' as Role, // Default role for public registration
    });

    await this.app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        resourceType: 'AUTH',
        ipAddress,
      },
    });

    // Send welcome email
    await emailQueue.add('welcome-email', {
      to: input.email,
      subject: 'Chào mừng bạn đến với EduViet',
      template: 'welcome',
      context: {
        name: user.fullName,
        loginUrl: `${process.env['FRONTEND_URL'] || 'http://localhost:4200'}/login`,
      },
    });

    // We can also send a verification email if needed here or in a separate endpoint
    await emailQueue.add('verify-email', {
      to: input.email,
      subject: 'Xác thực tài khoản EduViet',
      template: 'verify-email',
      context: {
        name: user.fullName,
        verifyUrl: `${process.env['FRONTEND_URL'] || 'http://localhost:4200'}/verify?token=dummy_token_for_now`, // TODO: implement real token
      },
    });

    return { message: 'Đăng ký thành công', userId: user.id };
  }

  async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await this.usersRepo.findByEmail(input.email);

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash!);
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
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token đã bị thu hồi hoặc hết hạn');
    }

    if (storedToken.userId !== payload.sub) {
      throw AppError.unauthorized('Refresh token không hợp lệ');
    }

    const user = await this.usersRepo.findById(storedToken.userId);
    if (!user) {
      throw AppError.unauthorized('Người dùng không tồn tại');
    }

    // Rotate: revoke old, issue new
    await this.app.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

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
