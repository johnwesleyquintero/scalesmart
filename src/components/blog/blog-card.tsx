import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BlogPost } from '@/lib/static-data-types';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function BlogCard({ post }: { readonly post: BlogPost }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="aspect-video overflow-hidden">
        <Image
          src={post.image || '/placeholder.svg?height=400&width=600'}
          alt={post.title}
          width={600}
          height={400}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{post.date}</span>
          </div>
          {post.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-xl">{post.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {post.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link
          href={`/blog/${post.slug}`}
          className="flex items-center text-primary hover:underline"
        >
          Read Article <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
