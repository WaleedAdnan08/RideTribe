"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Star } from "lucide-react";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(name, phoneNumber, password);
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Brand/Hero */}
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary via-primary to-purple-900 opacity-90" />
        <div className="absolute bottom-24 -left-24 w-96 h-96 bg-accent rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400 rounded-full opacity-10 blur-3xl" />

        <div className="relative z-10 text-primary-foreground max-w-lg">
          <div className="mb-8 flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Join the Tribe</h1>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            It takes a village. We just made it digital.
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Create an account to start building your trusted circle and managing rides effortlessly.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1 bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <Star className="w-6 h-6 text-yellow-300 mb-2" />
                <span className="font-bold text-lg">Trusted</span>
                <span className="text-xs opacity-80">Verified Connections</span>
             </div>
             <div className="flex flex-col gap-1 bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <Users className="w-6 h-6 text-blue-300 mb-2" />
                <span className="font-bold text-lg">Community</span>
                <span className="text-xs opacity-80">Parents helping parents</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Create an account
            </h2>
            <p className="text-muted-foreground mt-2">
              Enter your information to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 555 123 4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="h-11 bg-card"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-card"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-all"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;