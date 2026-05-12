-- AddColumn: view_count on blog_posts
ALTER TABLE "blog_posts" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;

-- Index for top-viewed queries
CREATE INDEX "blog_posts_view_count_idx" ON "blog_posts"("view_count");
