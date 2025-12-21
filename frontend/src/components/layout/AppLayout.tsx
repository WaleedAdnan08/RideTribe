"use client";

import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, Users, CalendarDays, MapPin, Car, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
<<<<<<< HEAD
      isMobile ? "w-full justify-start" : "justify-start w-full",
=======
      isMobile ? "w-full justify-start" : "justify-center",
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
      // Active link styling (optional, but good for UX)
      // location.pathname === to ? "bg-primary text-primary-foreground" : "text-sidebar-foreground"
    )}
  >
    <Icon className="h-5 w-5" />
<<<<<<< HEAD
    <span>{label}</span>
=======
    {!isMobile && <span className="sr-only">{label}</span>}
    {isMobile && <span>{label}</span>}
>>>>>>> 99a7bd89d699575d6cfb6dac3b9a739fe47fe8e9
  </Link>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { logout } = useAuth();
  const isMobile = useIsMobile();

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
          <div className="mt-auto pt-4 border-t">
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
                <div className="mt-auto pt-4 border-t">
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