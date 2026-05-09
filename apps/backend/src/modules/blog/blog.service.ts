import { PrismaClient } from '@prisma/client';
import { UserRole } from '@eduviet/shared-types';
import { AppError } from '../../shared/errors/app-error.js';
import { writeAuditLog } from '../../shared/utils/audit.js';
import { sanitizeContent, sanitizeText } from '../../shared/utils/sanitize.js';
import { BlogRepository, BlogFilters } from './blog.repository.js';
import { UsersRepository } from '../users/users.repository.js';

const CONTENT_ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_CREATOR', 'CONTENT_REVIEWER', 'CONTENT_APPROVER',
];

function buildSlug(title: string): string {
  return (
    title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 100)
    + '-' + Date.now()
  );
}

export class BlogService {
  private readonly repo: BlogRepository;
  private readonly usersRepo: UsersRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new BlogRepository(prisma);
    this.usersRepo = new UsersRepository(prisma);
  }

  async list(filters: BlogFilters, userRole?: UserRole) {
    const isAdmin = userRole && CONTENT_ADMIN_ROLES.includes(userRole);
    const { posts, total } = await this.repo.findMany(filters, !isAdmin);
    return {
      data: posts,
      meta: { total, page: filters.page, perPage: filters.perPage, totalPages: Math.ceil(total / filters.perPage) },
    };
  }

  async getBySlug(slug: string, userRole?: UserRole) {
    const post = await this.repo.findBySlug(slug);
    if (!post) throw AppError.notFound('Bài viết');

    const isAdmin = userRole && CONTENT_ADMIN_ROLES.includes(userRole);
    if (post.status !== 'PUBLISHED' && !isAdmin) {
      throw AppError.forbidden('Bạn không có quyền xem bài viết này');
    }
    return post;
  }

  async create(
    data: { title: string; content: string; coverImage?: string; tags?: string[] },
    authorId: string
  ) {
    const cleanTitle = sanitizeText(data.title);
    const cleanContent = sanitizeContent(data.content);
    const slug = buildSlug(cleanTitle);
    const post = await this.repo.create({
      title: cleanTitle,
      slug,
      content: cleanContent,
      coverImage: data.coverImage,
      tags: data.tags ?? [],
      authorId,
    });

    await writeAuditLog(this.prisma, {
      userId: authorId,
      action: 'LESSON_CREATED', // sẽ thêm BLOG_POST_CREATED sau
      resourceType: 'CONTENT',
      resourceId: post.id,
    });

    return post;
  }

  async publish(id: string, actorId: string) {
    const post = await this.repo.findById(id);
    if (!post) throw AppError.notFound('Bài viết');

    const updated = await this.repo.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    await writeAuditLog(this.prisma, {
      userId: actorId,
      action: 'LESSON_PUBLISHED',
      resourceType: 'CONTENT',
      resourceId: id,
    });

    return updated;
  }

  async update(id: string, data: Partial<{ title: string; content: string; coverImage: string; tags: string[] }>, actorId: string) {
    const post = await this.repo.findById(id);
    if (!post) throw AppError.notFound('Bài viết');
    if (post.authorId !== actorId) {
      // Check if actor is admin
      const user = await this.usersRepo.findById(actorId);
      if (!user || !CONTENT_ADMIN_ROLES.includes(user.role as UserRole)) {
        throw AppError.forbidden('Bạn không có quyền chỉnh sửa bài viết này');
      }
    }
    const cleanData = {
      ...data,
      ...(data.title !== undefined && { title: sanitizeText(data.title) }),
      ...(data.content !== undefined && { content: sanitizeContent(data.content) }),
    };
    return this.repo.update(id, cleanData);
  }

  async delete(id: string, actorId: string) {
    const post = await this.repo.findById(id);
    if (!post) throw AppError.notFound('Bài viết');
    await this.repo.softDelete(id);
  }

  // Comments
  async addComment(postId: string, data: { content: string; parentId?: string }, authorId: string) {
    const post = await this.repo.findById(postId);
    if (!post) throw AppError.notFound('Bài viết');
    return this.repo.createComment({ content: data.content, authorId, postId, parentId: data.parentId });
  }

  async hideComment(commentId: string, actorRole: UserRole) {
    const isModRole: UserRole[] = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_REVIEWER', 'CONTENT_APPROVER'];
    if (!isModRole.includes(actorRole)) throw AppError.forbidden('Bạn không có quyền ẩn bình luận');
    const comment = await this.repo.findCommentById(commentId);
    if (!comment) throw AppError.notFound('Bình luận');
    return this.repo.hideComment(commentId);
  }

  async deleteComment(commentId: string, actorId: string, actorRole: UserRole) {
    const comment = await this.repo.findCommentById(commentId);
    if (!comment) throw AppError.notFound('Bình luận');
    const isOwner = comment.authorId === actorId;
    const isMod = (['SUPER_ADMIN', 'SCHOOL_ADMIN'] as UserRole[]).includes(actorRole);
    if (!isOwner && !isMod) throw AppError.forbidden('Bạn không có quyền xóa bình luận này');
    return this.repo.deleteComment(commentId);
  }
}
