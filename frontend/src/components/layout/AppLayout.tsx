"use client";

import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, Users, CalendarDays, MapPin, Car, Home, Trash2 } from "lucide-react";
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

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isMobile?: boolean;
}

const NavLink = ({ to, icon: Icon, label, isMobile }: NavLinkProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      "hover:bg-primary/10 hover:text-primary", // More subtle hover for nav links
      isMobile ? "w-full justify-start" : "justify-start w-full",
      // Active link styling (optional, but good for UX)
      // location.pathname === to ? "bg-primary text-primary-foreground" : "text-sidebar-foreground"
    )}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </Link>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
    { to: "/tribe", icon: Users, label: "Tribe" },
    { to: "/schedule", icon: CalendarDays, label: "Schedule" },
    { to: "/destinations", icon: MapPin, label: "Destinations" },
    { to: "/matches", icon: Car, label: "Ride Matches" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4 dark:bg-sidebar-background shadow-sm">
          <div className="flex items-center justify-center h-16 border-b mb-4">
            <h1 className="text-2xl font-bold text-primary dark:text-primary-foreground">RideTribe</h1>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t space-y-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="mr-2 h-5 w-5" />
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
            <Button onClick={logout} variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary">
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>
      )}

      <div className="flex flex-col flex-1">
        {/* Top Nav for Mobile */}
        {isMobile && (
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:hidden shadow-sm">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Home className="h-6 w-6 text-primary" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-64 bg-sidebar dark:bg-sidebar-background">
                <div className="flex items-center h-16 border-b mb-4">
                  <h1 className="text-2xl font-bold text-primary dark:text-primary-foreground">RideTribe</h1>
                </div>
                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} isMobile />
                  ))}
                </nav>
                <div className="mt-auto pt-4 border-t space-y-1">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="mr-2 h-5 w-5" />
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
                  <Button onClick={logout} variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary">
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold text-primary">RideTribe</h1>
            <div className="w-10"></div> {/* Placeholder for alignment */}
          </header>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;