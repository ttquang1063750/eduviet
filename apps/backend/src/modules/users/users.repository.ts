import { PrismaClient, Prisma } from '@prisma/client';
import { hashPII } from '../../shared/utils/pii-crypto.js';
import { UserRole } from '@eduviet/shared-types';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  roles: UserRole[];
  title?: string;
  schoolId?: string;
}

export interface UserFilters {
  page: number;
  perPage: number;
  role?: string;   // filter by single role (contains check)
  search?: string;
}

// Internal type for DB results with decrypted PII
interface UserDbRaw {
  id: string;
  email: string;
  phone: string | null;
  email_hash: string;
  phone_hash: string | null;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  roles: unknown;  // JSONB — parse to UserRole[]
  title: string | null;
  is_active: boolean;
  is_verified: boolean;
  school_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class UsersRepository {
  private readonly ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY!;

  constructor(private readonly prisma: PrismaClient) {}

  private parseRoles(raw: unknown): UserRole[] {
    if (Array.isArray(raw)) return raw as UserRole[];
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as UserRole[]; } catch { /* fall through */ }
    }
    return ['STUDENT'];
  }

  private mapRawToUser(raw: any) {
    if (!raw) return null;
    return {
      id: raw.id,
      email: raw.email,
      phone: raw.phone ?? null,
      fullName: raw.full_name || raw.fullName,
      roles: this.parseRoles(raw.roles),
      title: raw.title ?? null,
      avatarUrl: (raw.avatar_url || raw.avatarUrl) ?? null,
      isActive: raw.is_active ?? raw.isActive,
      isVerified: raw.is_verified ?? raw.isVerified,
      schoolId: (raw.school_id || raw.schoolId) ?? null,
      createdAt: raw.created_at || raw.createdAt,
    };
  }

  async findMany(filters: UserFilters) {
    const { page, perPage, role, search } = filters;
    const skip = (page - 1) * perPage;

    // For findMany, we'll use a mix. For search on email, we use exact match on hash.
    // For fullName search, we can still use Prisma's findMany if we don't need to decrypt email/phone in the list.
    // But usually we need email in the list.
    
    let whereClause = Prisma.sql`u.deleted_at IS NULL`;
    if (role) {
      // JSONB contains check — u.roles @> '["ROLE"]'
      whereClause = Prisma.sql`${whereClause} AND u.roles @> ${JSON.stringify([role])}::jsonb`;
    }
    if (search) {
      const searchHash = hashPII(search);
      whereClause = Prisma.sql`${whereClause} AND (u.full_name ILIKE ${`%${search}%`} OR u.email_hash = ${searchHash})`;
    }

    const users = await this.prisma.$queryRaw<any[]>`
      SELECT
        u.id,
        pgp_sym_decrypt(u.email, ${this.ENCRYPTION_KEY}) as email,
        u.full_name as "fullName",
        u.roles,
        u.title,
        u.avatar_url as "avatarUrl",
        u.is_active as "isActive",
        u.is_verified as "isVerified",
        u.school_id as "schoolId",
        u.created_at as "createdAt"
      FROM users u
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${perPage} OFFSET ${skip}
    `;

    const totalCount = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM users u WHERE ${whereClause}
    `;

    return { 
      users: users.map(u => this.mapRawToUser(u)), 
      total: Number(totalCount[0].count) 
    };
  }

  async findById(id: string) {
    const users = await this.prisma.$queryRaw<any[]>`
      SELECT
        u.id,
        pgp_sym_decrypt(u.email, ${this.ENCRYPTION_KEY}) as email,
        pgp_sym_decrypt(u.phone, ${this.ENCRYPTION_KEY}) as phone,
        u.full_name as "fullName",
        u.roles,
        u.title,
        u.avatar_url as "avatarUrl",
        u.is_active as "isActive",
        u.is_verified as "isVerified",
        u.school_id as "schoolId",
        u.created_at as "createdAt",
        s.name as "schoolName"
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.id = ${id} AND u.deleted_at IS NULL
    `;

    if (users.length === 0) return null;
    const user = users[0];
    
    return {
      ...this.mapRawToUser(user),
      phone: user.phone,
      school: user.schoolId ? { id: user.schoolId, name: user.schoolName } : null
    };
  }

  async findByEmail(email: string) {
    const emailHash = hashPII(email);
    const users = await this.prisma.$queryRaw<any[]>`
      SELECT
        u.id,
        pgp_sym_decrypt(u.email, ${this.ENCRYPTION_KEY}) as email,
        u.password_hash as "passwordHash",
        u.full_name as "fullName",
        u.roles,
        u.title,
        u.avatar_url as "avatarUrl",
        u.is_active as "isActive",
        u.is_verified as "isVerified",
        u.school_id as "schoolId"
      FROM users u
      WHERE u.email_hash = ${emailHash} AND u.deleted_at IS NULL
    `;

    if (users.length === 0) return null;
    const user = users[0];
    return {
      ...this.mapRawToUser(user),
      passwordHash: user.passwordHash
    };
  }

  async create(data: CreateUserData) {
    const emailHash = hashPII(data.email)!;
    const phoneHash = data.phone ? hashPII(data.phone) : null;

    const users = await this.prisma.$queryRaw<any[]>`
      INSERT INTO users (
        id,
        email,
        email_hash,
        phone,
        phone_hash,
        password_hash,
        full_name,
        roles,
        title,
        school_id,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        pgp_sym_encrypt(${data.email}, ${this.ENCRYPTION_KEY}),
        ${emailHash},
        ${data.phone ? Prisma.sql`pgp_sym_encrypt(${data.phone}, ${this.ENCRYPTION_KEY})` : Prisma.sql`NULL`},
        ${phoneHash},
        ${data.passwordHash},
        ${data.fullName},
        ${JSON.stringify(data.roles)}::jsonb,
        ${data.title ?? null},
        ${data.schoolId ?? null},
        NOW(),
        NOW()
      ) RETURNING id, full_name as "fullName", roles, title, is_active as "isActive", is_verified as "isVerified", school_id as "schoolId", created_at as "createdAt"
    `;

    return {
      ...this.mapRawToUser(users[0]),
      email: data.email // Return plain email for immediate use
    };
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  async update(id: string, data: any) {
    const updates: Prisma.Sql[] = [];
    
    if (data.fullName) updates.push(Prisma.sql`full_name = ${data.fullName}`);
    if (data.roles !== undefined) updates.push(Prisma.sql`roles = ${JSON.stringify(data.roles)}::jsonb`);
    if (data.title !== undefined) updates.push(Prisma.sql`title = ${data.title}`);
    if (data.isActive !== undefined) updates.push(Prisma.sql`is_active = ${data.isActive}`);
    if (data.isVerified !== undefined) updates.push(Prisma.sql`is_verified = ${data.isVerified}`);
    if (data.schoolId !== undefined) updates.push(Prisma.sql`school_id = ${data.schoolId}`);
    
    if (data.email) {
      updates.push(Prisma.sql`email = pgp_sym_encrypt(${data.email}, ${this.ENCRYPTION_KEY})`);
      updates.push(Prisma.sql`email_hash = ${hashPII(data.email)}`);
    }
    
    if (data.phone !== undefined) {
      if (data.phone === null) {
        updates.push(Prisma.sql`phone = NULL`);
        updates.push(Prisma.sql`phone_hash = NULL`);
      } else {
        updates.push(Prisma.sql`phone = pgp_sym_encrypt(${data.phone}, ${this.ENCRYPTION_KEY})`);
        updates.push(Prisma.sql`phone_hash = ${hashPII(data.phone)}`);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push(Prisma.sql`updated_at = NOW()`);

    const setClause = updates.reduce((acc, curr, idx) => 
      idx === 0 ? curr : Prisma.sql`${acc}, ${curr}`
    );

    await this.prisma.$executeRaw`
      UPDATE users SET ${setClause} WHERE id = ${id}
    `;

    return this.findById(id);
  }
}
