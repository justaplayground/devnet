import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, Share2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    cover_image_url?: string;
    author: {
      username: string;
      display_name: string;
      avatar_url?: string;
    };
    tags: Array<{
      name: string;
      color: string;
    }>;
    like_count: number;
    comment_count: number;
    bookmark_count: number;
    view_count: number;
    created_at: string;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement like functionality
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement bookmark functionality
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement share functionality
  };

  return (
    <Card className="group hover:shadow-card-hover transition-all duration-200">
      {post.cover_image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-white text-xs">
              {post.author.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {post.author.display_name || post.author.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <Link to={`/posts/${post.id}`} className="group/title">
          <h2 className="text-xl font-bold leading-tight text-foreground group-hover/title:text-primary transition-colors">
            {post.title}
          </h2>
        </Link>

        <div className="flex flex-wrap gap-2 mt-3">
          {post.tags.map((tag) => (
            <Badge
              key={tag.name}
              variant="tag"
              className="text-xs hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
              style={{ borderColor: tag.color + '20' }}
            >
              #{tag.name}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
            >
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.like_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">{post.comment_count}</span>
            </Button>

            <div className="flex items-center text-muted-foreground text-xs">
              <Eye className="h-4 w-4 mr-1" />
              <span>{post.view_count}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50"
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-green-500 hover:bg-green-50"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;