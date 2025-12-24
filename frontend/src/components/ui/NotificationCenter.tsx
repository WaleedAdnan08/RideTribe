import React, { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import api, { tribeApi } from "@/lib/api";
import { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  // Derived state for unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const data = await api.get<Notification[]>("/notifications");
      // The api utility returns the data directly, not wrapped in a response object
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isLoggedIn]);

  const handleMarkAsRead = async (id: string) => {
    const notification = notifications.find((n) => (n.id === id || n._id === id));
    if (!notification || notification.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, is_read: true } : n))
    );

    try {
      // api.patch requires data as the second argument
      await api.patch(`/notifications/${id}/read`, {});
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert if failed (optional, but keeps UI consistent with backend)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, is_read: false } : n))
      );
    }
  };

  const handleRespondToInvite = async (e: React.MouseEvent, notification: Notification, status: "accepted" | "declined") => {
      e.stopPropagation(); // Prevent marking as read trigger if nested
      if (!notification.related_id) return;

      try {
          await tribeApi.respondToInvite(notification.related_id, status);
          
          toast({
              title: status === "accepted" ? "Invite Accepted" : "Invite Declined",
              description: status === "accepted"
                  ? "You have joined the tribe."
                  : "You declined the tribe invitation.",
              variant: status === "accepted" ? "default" : "destructive"
          });

          // Mark notification as read automatically
          handleMarkAsRead(notification.id || notification._id!);
          
          // Ideally we should also refresh the tribes list if we were on that page,
          // but that state is local to TribePage. The user will see it update on refresh.
          
      } catch (error: any) {
          toast({
              title: "Error",
              description: error.message || "Failed to respond to invite.",
              variant: "destructive"
          });
      }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <span className="text-xs text-muted-foreground">
            {unreadCount} unread
          </span>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id || notification._id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification.id || notification._id!)}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-xs font-medium uppercase text-primary tracking-wide">
                      {notification.type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-snug mb-2">{notification.message}</p>
                  
                  {notification.type === "invite_received" && notification.related_id && !notification.is_read && (
                      <div className="flex gap-2 mt-2">
                          <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => handleRespondToInvite(e, notification, "accepted")}
                          >
                              <Check className="w-3 h-3 mr-1" /> Accept
                          </Button>
                          <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={(e) => handleRespondToInvite(e, notification, "declined")}
                          >
                              <X className="w-3 h-3 mr-1" /> Decline
                          </Button>
                      </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}