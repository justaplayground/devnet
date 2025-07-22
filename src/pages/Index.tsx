import React, { useEffect, useState } from 'react';
import Header from '@/components/Layout/Header';
import Sidebar from '@/components/Layout/Sidebar';
import RightSidebar from '@/components/Layout/RightSidebar';
import PostCard from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Sparkles } from 'lucide-react';

const Index = () => {
  const { loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username, display_name, avatar_url),
          post_tags (
            tags (name, color)
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedPosts = data?.map(post => ({
        ...post,
        author: post.profiles,
        tags: post.post_tags.map(pt => pt.tags)
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <p className="text-muted-foreground">Loading DevCommunity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex max-w-7xl mx-auto w-full">
        <Sidebar />
        <main className="flex-1 p-6 max-w-2xl w-full mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-hero rounded-xl p-8 mb-8 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">
                Welcome to DevCommunity
              </h1>
              <p className="text-xl opacity-90 mb-6">
                A place where developers share knowledge, learn from each other, and grow together.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Explore Posts
                </Button>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Trending Now
                </Button>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Latest Posts</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Latest</Button>
                <Button variant="ghost" size="sm">Trending</Button>
                <Button variant="ghost" size="sm">Popular</Button>
              </div>
            </div>

            {loadingPosts ? (
              <div className="grid gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
              </div>
            )}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
