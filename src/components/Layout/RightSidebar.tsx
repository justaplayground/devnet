import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const popularTags = [
  { name: 'JavaScript', count: 1234, color: '#f7df1e' },
  { name: 'React', count: 987, color: '#61dafb' },
  { name: 'TypeScript', count: 765, color: '#3178c6' },
  { name: 'Node.js', count: 543, color: '#339933' },
  { name: 'Python', count: 432, color: '#3776ab' },
  { name: 'Web Development', count: 321, color: '#ff6b6b' },
];

const RightSidebar = () => {
  return (
    <div className="w-80 hidden xl:block h-screen sticky top-16 overflow-y-auto p-4 space-y-6">
      {/* Popular Tags */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Popular Tags</h3>
          <div className="space-y-2">
            {popularTags.map((tag) => (
              <Link
                key={tag.name}
                to={`/tags/${tag.name.toLowerCase()}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tag.color }} 
                  />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {tag.name}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tag.count}
                </Badge>
              </Link>
            ))}
          </div>
          <Button asChild variant="ghost" size="sm" className="w-full mt-3">
            <Link to="/tags">View all tags</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
          <div className="space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/write">
                <Settings className="h-4 w-4 mr-2" />
                Write a post
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RightSidebar; 