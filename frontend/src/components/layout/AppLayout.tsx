"use client";

import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Users, CalendarDays, MapPin, Car, Home, Trash2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { NotificationCenter } from "@/components/ui/NotificationCenter";

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isMobile?: boolean;
  isActive?: boolean;
}

const NavLink = ({ to, icon: Icon, label, isMobile, isActive }: NavLinkProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
      isActive 
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      isMobile ? "w-full justify-start" : "justify-start w-full"
    )}
  >
    <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
    <span>{label}</span>
  </Link>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/auth/me");
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/tribe", icon: Users, label: "My Tribe" },
    { to: "/schedule", icon: CalendarDays, label: "Schedule" },
    { to: "/matches", icon: Car, label: "Ride Matches" },
    { to: "/destinations", icon: MapPin, label: "Destinations" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-20 px-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">RideTribe</h1>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            icon={item.icon} 
            label={item.label} 
            isActive={location.pathname === item.to}
          />
        ))}
      </div>

      <div className="p-4 border-t border-border/50 space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="mr-3 h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Button onClick={logout} variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <aside className="hidden md:flex w-72 flex-col border-r bg-card shadow-sm fixed h-full z-30">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Wrapper */}
      <div className={cn("flex flex-col flex-1 min-h-screen", !isMobile && "ml-72")}>
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 md:px-8 shadow-sm">
          {isMobile ? (
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <span className="font-bold text-lg">RideTribe</span>
            </div>
          ) : (
             <div className="flex-1" /> // Spacer
          )}
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto fade-in">
          <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;