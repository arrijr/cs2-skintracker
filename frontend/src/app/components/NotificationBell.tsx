// /frontend/src/app/components/NotificationBell.tsx — [Frontend]
// {/* Enhanced Notification Bell with Real Notifications */}
"use client";
import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Heart,
  X,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatUSD, safeToFixed } from "@/lib/num";
import { apiUrl, fetchJson } from "@/lib/api";

interface Notification {
  id: string;
  type: 'price_alert' | 'portfolio_change' | 'watchlist_update' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = "" }: NotificationBellProps) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock notifications for now - replace with real API
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'price_alert',
      title: 'Price Alert Triggered',
      message: 'AK-47 | Redline dropped below $45.00',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      actionUrl: '/skins/1',
      icon: 'alert'
    },
    {
      id: '2',
      type: 'portfolio_change',
      title: 'Portfolio Update',
      message: 'Your portfolio gained +2.3% today (+$127.50)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      actionUrl: '/portfolio',
      icon: 'trending-up'
    },
    {
      id: '3',
      type: 'watchlist_update',
      title: 'New Skin Added',
      message: 'AWP | Dragon Lore added to your watchlist',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: true,
      actionUrl: '/watchlist',
      icon: 'heart'
    }
  ];

  useEffect(() => {
    if (isSignedIn && user) {
      loadNotifications();
    }
  }, [isSignedIn, user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // For now, use mock data
      // TODO: Replace with real API call
      // const token = await getToken({ template: "backend" });
      // const data = await fetchJson(apiUrl("/api/v1/notifications"), {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Implement API call to mark notification as read
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implement API call to mark all notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string, icon?: string) => {
    if (icon === 'alert') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    if (icon === 'trending-up') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (icon === 'trending-down') return <TrendingDown className="h-4 w-4 text-red-400" />;
    if (icon === 'heart') return <Heart className="h-4 w-4 text-pink-400" />;
    
    switch (type) {
      case 'price_alert': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'portfolio_change': return <DollarSign className="h-4 w-4 text-green-400" />;
      case 'watchlist_update': return <Heart className="h-4 w-4 text-pink-400" />;
      case 'system': return <Bell className="h-4 w-4 text-blue-400" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isSignedIn || !user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative h-10 w-10 p-0 hover:bg-muted/50 transition-all duration-200 hover-scale ${className}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse-slow"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-6 px-2 text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mx-auto mb-2"></div>
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                  }
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type, notification.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
            <p className="text-xs">You're all caught up!</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
