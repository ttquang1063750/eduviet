export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  tags: string[];
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  authorId: string;
  author: { id: string; name: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl?: string };
  content: string;
  isHidden: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}
