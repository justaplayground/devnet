import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, type AdminPost, type AdminStats, type AdminUser } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    todayPosts: 0,
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
      if (user.isAdmin || user.isModerator) {
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
      const [usersRes, postsRes, statsRes] = await Promise.all([
        api.adminUsers(),
        api.adminPosts(),
        api.adminStats(),
      ]);
      setUsers(usersRes.users);
      setPosts(postsRes.posts);
      setStats(statsRes.stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    }
  };

  const toggleUserRole = async (userId: string, role: 'admin' | 'moderator', currentValue: boolean) => {
    try {
      await api.updateUserRole(userId, role, !currentValue);

      setUsers(
        users.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                ...(role === 'admin' ? { is_admin: !currentValue } : { is_moderator: !currentValue }),
              }
            : u,
        ),
      );

      toast({
        title: 'Success',
        description: `User ${role} status updated`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
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
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{u.display_name || u.username}</div>
                          <div className="text-sm text-muted-foreground">@{u.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.post_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.is_admin && <Badge variant="destructive">Admin</Badge>}
                          {u.is_moderator && <Badge variant="warning">Moderator</Badge>}
                          {!u.is_admin && !u.is_moderator && <Badge variant="secondary">User</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={u.is_admin ? 'destructive' : 'outline'}
                            onClick={() => toggleUserRole(u.user_id, 'admin', u.is_admin)}>
                            {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                          <Button
                            size="sm"
                            variant={u.is_moderator ? 'warning' : 'outline'}
                            onClick={() => toggleUserRole(u.user_id, 'moderator', u.is_moderator)}>
                            {u.is_moderator ? 'Remove Mod' : 'Make Mod'}
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
                      <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
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
