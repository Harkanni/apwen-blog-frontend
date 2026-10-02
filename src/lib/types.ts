export type JSONNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: JSONNode[];
  marks?: { type: string; attrs?: Record<string, any> }[];
  text?: string;
};

export type PostState = 'draft' | 'published' | 'scheduled' | 'trash';

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  cover_image: string | null;
  cover_alt: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  state: PostState;
  featured: boolean;
  author_name: string;
  reading_minutes: number;
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = PostSummary & { content: JSONNode };

export type PostList = { posts: PostSummary[]; page: number; pages: number; total: number; limit: number };

export type Settings = {
  siteName: string;
  tagline: string;
  about: string;
  instagram: string;
  facebook: string;
  website: string;
  contactEmail: string;
  categories: string[];
};

export type User = { id: number; email: string; name: string; role: 'admin' | 'editor' };

export type Media = {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  created_at: string;
};

export type Revision = { id: number; title: string; reason: string; created_at: string; size: number };
