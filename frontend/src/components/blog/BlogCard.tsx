// frontend/src/components/blog/BlogCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 group overflow-hidden">
        {post.featuredImage && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-brand-celadon-600 text-white">
                {post.category}
              </Badge>
            </div>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(post.publishedAt || post.createdAt)}
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {post.viewCount}
            </div>
          </div>
          
          <h3 className="text-xl font-bold group-hover:text-brand-celadon-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground line-clamp-3">
            {post.description || post.excerpt}
          </p>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <div className="flex items-center text-brand-celadon-600 font-medium group-hover:gap-2 transition-all">
            Read More
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
