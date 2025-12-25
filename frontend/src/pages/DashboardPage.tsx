"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LogOut, Users, CalendarDays, MapPin, Car, UserPen, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DashboardPage = () => {
  const { currentUser, logout, updateProfile } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: ""
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setEditForm({ ...editForm, phone: value });
  };

  const handleEditProfileOpen = () => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name,
        phone: currentUser.phoneNumber || currentUser.phone
      });
    }
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await updateProfile(editForm);
      setIsEditProfileOpen(false);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsUpdating(false);
    }
  };

  const featureCards = [
    {
      to: "/tribe",
      icon: Users,
      title: "My Tribe",
      description: "Manage your trusted circle of parents and drivers.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      to: "/schedule",
      icon: CalendarDays,
      title: "Schedule",
      description: "Organize drop-offs, pick-ups, and recurring trips.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      to: "/matches",
      icon: Car,
      title: "Ride Matches",
      description: "Find carpooling opportunities with your tribe.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20"
    },
    {
      to: "/destinations",
      icon: MapPin,
      title: "Destinations",
      description: "Save common locations like schools and fields.",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-90" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, {currentUser?.name || "Friend"}!
            </h1>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Your carpooling command center is ready. You have upcoming trips and new match opportunities waiting.
            </p>
            <div className="flex gap-3 pt-2">
              <Button asChild variant="secondary" className="font-semibold shadow-sm hover:shadow-md transition-all">
                <Link to="/schedule">
                  View Schedule <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-white" onClick={handleEditProfileOpen}>
                    <UserPen className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your personal information here.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={handlePhoneChange}
                          placeholder="11-digit phone number"
                          minLength={11}
                          maxLength={11}
                        />
                        <p className="text-xs text-muted-foreground">
                          {editForm.phone.length}/11 digits
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Decorative Illustration Placeholder or just visual balance */}
          <div className="hidden md:block p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
             <Car className="w-16 h-16 text-white opacity-90" />
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featureCards.map((card) => (
          <Link key={card.to} to={card.to} className="group block h-full">
            <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-muted/60">
              <CardHeader className="space-y-1 pb-2">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${card.bg}`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                 </div>
                <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;