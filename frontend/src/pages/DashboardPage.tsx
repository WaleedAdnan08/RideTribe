"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LogOut, Users, CalendarDays, MapPin, Car, UserPen, Loader2 } from "lucide-react";
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

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center py-12 md:py-20 mb-8 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-lg shadow-xl relative">
        <div className="absolute top-4 right-4">
          <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" onClick={handleEditProfileOpen}>
                <UserPen className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] text-left text-foreground">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your personal information here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateProfile}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
          Welcome to RideTribe, {currentUser?.name || "User"}!
        </h1>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          Simplify your family's carpooling with trusted connections and smart scheduling.
        </p>
      </div>

      <Card className="w-full max-w-4xl p-6 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">
            Your RideTribe Hub
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Quick access to manage your carpooling world.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link to="/tribe" className="block">
              <Card className="flex flex-col items-center p-6 h-full hover:shadow-md transition-shadow duration-200 ease-in-out group">
                <Users className="w-12 h-12 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg group-hover:text-primary">Tribe Management</h3>
                <p className="text-sm text-muted-foreground">Connect with trusted families.</p>
              </Card>
            </Link>
            <Link to="/schedule" className="block">
              <Card className="flex flex-col items-center p-6 h-full hover:shadow-md transition-shadow duration-200 ease-in-out group">
                <CalendarDays className="w-12 h-12 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg group-hover:text-primary">Schedule Management</h3>
                <p className="text-sm text-muted-foreground">Organize your children's trips.</p>
              </Card>
            </Link>
            <Link to="/matches" className="block">
              <Card className="flex flex-col items-center p-6 h-full hover:shadow-md transition-shadow duration-200 ease-in-out group">
                <Car className="w-12 h-12 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg group-hover:text-primary">Ride Matching</h3>
                <p className="text-sm text-muted-foreground">Find carpooling opportunities.</p>
              </Card>
            </Link>
            <Link to="/destinations" className="block">
              <Card className="flex flex-col items-center p-6 h-full hover:shadow-md transition-shadow duration-200 ease-in-out group">
                <MapPin className="w-12 h-12 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg group-hover:text-primary">Destinations</h3>
                <p className="text-sm text-muted-foreground">Manage common locations.</p>
              </Card>
            </Link>
          </div>

          <Button onClick={logout} className="mt-4" variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;