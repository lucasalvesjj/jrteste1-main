import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import type { BlogPost } from "@/data/blogTypes";
import { getCategoryEmoji, getCategoryLabel, getCategoryTone, getPostCategories, getPrimaryCategory } from "@/lib/blogCategories";
import { useBlogStore } from "@/stores/blogStore";
import OptimizedImage from "@/components/OptimizedImage";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  const availableCategories = useBlogStore((state) => state.categories);
  const categories = getPostCategories(post);
  const primaryCategory = getPrimaryCategory(post);

  return (
    <Link to={`/${post.slug}/`} className="group block">
      <article className="h-full overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg">
        <div className="flex h-48 items-center justify-center bg-accent overflow-hidden">
          {post.image ? (
            <OptimizedImage
              src={post.image}
              alt={post.title}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
              preset="card"
            />
          ) : (
            <span className="text-4xl">{getCategoryEmoji(primaryCategory, availableCategories)}</span>
          )}
        </div>
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1">
              {categories.map((categoryId) => (
                <span key={categoryId} className={`rounded-full px-2 py-1 text-xs font-semibold ${getCategoryTone(categoryId, availableCategories)}`}>
                  {getCategoryLabel(categoryId, availableCategories)}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(post.date).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <h3 className="mb-2 line-clamp-2 font-heading font-bold text-foreground transition-colors group-hover:text-primary">
            {post.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
