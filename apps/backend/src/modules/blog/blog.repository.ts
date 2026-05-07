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
        author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
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
}
