import { PrismaClient, Prisma } from '@prisma/client';

export interface BlogFilters {
  page: number;
  perPage: number;
  status?: string;
  authorId?: string;
  tag?: string;
  search?: string;
}

const POST_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  status: true,
  tags: true,
  viewCount: true,
  publishedAt: true,
  author: { select: { id: true, fullName: true, avatarUrl: true } },
  _count: { select: { comments: true } },
  createdAt: true,
} satisfies Prisma.BlogPostSelect;

export class BlogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: BlogFilters, onlyPublished = true) {
    const { page, perPage, status, authorId, tag, search } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.BlogPostWhereInput = {
      deletedAt: null,
      ...(onlyPublished ? { status: 'PUBLISHED' } : status ? { status: status as never } : {}),
      ...(authorId ? { authorId } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(search
        ? { title: { contains: search, mode: 'insensitive' } }
        : {}),
    };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        select: POST_LIST_SELECT,
        skip,
        take: perPage,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { posts, total };
  }

  async findBySlug(slug: string) {
    return this.prisma.blogPost.findUnique({
      where: { slug, deletedAt: null },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true, roles: true } },
        comments: {
          where: { parentId: null, deletedAt: null, isHidden: false },
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true } },
            replies: {
              where: { deletedAt: null, isHidden: false },
              include: {
                author: { select: { id: true, fullName: true, avatarUrl: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.blogPost.findUnique({ where: { id, deletedAt: null } });
  }

  async create(data: {
    title: string;
    slug: string;
    content: string;
    coverImage?: string;
    tags: string[];
    authorId: string;
  }) {
    return this.prisma.blogPost.create({ data, select: POST_LIST_SELECT });
  }

  async update(id: string, data: Partial<{ title: string; content: string; coverImage: string; tags: string[]; status: string; publishedAt: Date | null }>) {
    return this.prisma.blogPost.update({ where: { id }, data: data as never });
  }

  async softDelete(id: string) {
    return this.prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Tăng viewCount thêm 1 (atomic) */
  async incrementView(id: string) {
    return this.prisma.blogPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    });
  }

  /** Lấy top N bài viết được xem nhiều nhất (PUBLISHED) */
  async findTopViewed(limit = 3) {
    return this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: POST_LIST_SELECT,
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  /** Lấy các bài viết liên quan theo tags, loại trừ bài hiện tại */
  async findRelated(postId: string, tags: string[], limit = 5) {
    return this.prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        id: { not: postId },
        tags: { hasSome: tags },
      },
      select: POST_LIST_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  // Comments
  async createComment(data: { content: string; authorId: string; postId: string; parentId?: string }) {
    return this.prisma.comment.create({
      data,
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  async hideComment(id: string) {
    return this.prisma.comment.update({ where: { id }, data: { isHidden: true } });
  }

  async deleteComment(id: string) {
    return this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findCommentById(id: string) {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async getPopularTags(limit = 20): Promise<string[]> {
    const result = await this.prisma.$queryRaw<{ tag: string }[]>`
      SELECT unnest(tags) as tag, COUNT(*)::int as count
      FROM blog_posts
      WHERE deleted_at IS NULL
      GROUP BY tag
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return result.map((r) => r.tag);
  }
}
