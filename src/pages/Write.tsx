import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { ArrowLeft, Save, Eye, Plus, X } from 'lucide-react';

const Write = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide a title and content for your post.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(title);
      
      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          excerpt: excerpt || content.slice(0, 200) + '...',
          slug,
          status,
          author_id: user!.id,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (postError) throw postError;

      // Handle tags if any
      if (tags.length > 0) {
        for (const tagName of tags) {
          // Check if tag exists or create it
          let { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .single();

          if (!existingTag) {
            const { data: newTagData, error: tagError } = await supabase
              .from('tags')
              .insert({
                name: tagName,
                slug: generateSlug(tagName)
              })
              .select()
              .single();

            if (tagError) throw tagError;
            existingTag = newTagData;
          }

          // Link tag to post
          await supabase
            .from('post_tags')
            .insert({
              post_id: post.id,
              tag_id: existingTag.id
            });
        }
      }

      toast({
        title: status === 'published' ? "Post published!" : "Draft saved!",
        description: `Your post has been ${status === 'published' ? 'published' : 'saved as draft'} successfully.`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: "Error saving post",
        description: error.message || "Failed to save your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold">Write a Post</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('draft')}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => handleSave('published')}
                disabled={isLoading}
                className="gap-2"
              >
                Publish
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Post Details */}
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter your post title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                  <Input
                    id="excerpt"
                    placeholder="Brief description of your post..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                {isPreview ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MDEditor.Markdown source={content} rehypePlugins={[rehypeSanitize]} />
                  </div>
                ) : (
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    preview="edit"
                    hideToolbar={false}
                    height={400}
                    previewOptions={{
                      rehypePlugins: [rehypeSanitize],
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Write;