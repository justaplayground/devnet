import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, TrendingUp, Tag, Bookmark, Users } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Trending', href: '/trending', icon: TrendingUp },
  { name: 'Tags', href: '/tags', icon: Tag },
  { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { name: 'Community', href: '/community', icon: Users },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen sticky top-16 overflow-y-auto border-r bg-background p-4">
      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;