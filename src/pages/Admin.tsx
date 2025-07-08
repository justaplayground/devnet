import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, MessageSquare, BarChart3, Shield, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  is_admin: boolean;
  is_moderator: boolean;
  post_count: number;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  author: {
    username: string;
    display_name: string;
  };
  status: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    todayPosts: 0
  });

  useEffect(() => {
    checkAuthorization();
  }, [user]);

  const checkAuthorization = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_moderator')
        .eq('user_id', user.id)
        .single();

      if (profile?.is_admin || profile?.is_moderator) {
        setIsAuthorized(true);
        await loadData();
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          display_name,
          is_admin,
          is_moderator,
          post_count,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get email from auth metadata
      const usersWithEmail = await Promise.all(
        (usersData || []).map(async (profile) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
          return {
            ...profile,
            email: authUser.user?.email || 'N/A'
          };
        })
      );

      setUsers(usersWithEmail);

      // Load posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          status,
          created_at,
          like_count,
          comment_count,
          profiles!posts_author_id_fkey (
            username,
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setPosts(postsData?.map(post => ({
        ...post,
        author: post.profiles
      })) || []);

      // Load stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: todayPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      setStats({
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        todayPosts: todayPosts || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    }
  };

  const toggleUserRole = async (userId: string, role: 'admin' | 'moderator', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [`is_${role}`]: !currentValue })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, [`is_${role}`]: !currentValue }
          : user
      ));

      toast({
        title: "Success",
        description: `User ${role} status updated`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">Please sign in to access the admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, content, and platform settings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPosts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.display_name || user.username}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.post_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.is_admin && <Badge variant="destructive">Admin</Badge>}
                          {user.is_moderator && <Badge variant="warning">Moderator</Badge>}
                          {!user.is_admin && !user.is_moderator && <Badge variant="secondary">User</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={user.is_admin ? "destructive" : "outline"}
                            onClick={() => toggleUserRole(user.id, 'admin', user.is_admin)}
                          >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_moderator ? "warning" : "outline"}
                            onClick={() => toggleUserRole(user.id, 'moderator', user.is_moderator)}
                          >
                            {user.is_moderator ? 'Remove Mod' : 'Make Mod'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Post Management</CardTitle>
              <CardDescription>Monitor and moderate posts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>@{post.author.username}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === 'published' ? 'success' : 'secondary'}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {post.like_count} likes • {post.comment_count} comments
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(post.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comment Moderation</CardTitle>
              <CardDescription>Review and moderate user comments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Comment moderation will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;