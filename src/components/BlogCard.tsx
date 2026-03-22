import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { BlogPost, categories } from "@/data/blogPosts";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  const cat = categories.find((c) => c.id === post.category);

  return (
    <Link to={`/${post.slug}/`} className="block group">
      <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        <div className="h-48 bg-accent flex items-center justify-center">
          <span className="text-4xl">
            {post.category === "irrigacao" ? "🌱" : post.category === "ferramentas" ? "🔧" : "⚙️"}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              post.category === "irrigacao" ? "bg-brand-green/10 text-brand-green" :
              post.category === "ferramentas" ? "bg-brand-orange/10 text-brand-orange" :
              "bg-primary/10 text-primary"
            }`}>
              {cat?.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(post.date).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
