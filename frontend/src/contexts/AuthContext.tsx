"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";
import api from "@/lib/api";
import { User } from "@/types";

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface AuthContextType {
  currentUser: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  signup: (name: string, phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = sessionStorage.getItem("authToken");
      if (storedToken) {
        try {
          const user = await api.get<any>("/auth/me");
          setCurrentUser({
            ...user,
            id: user._id || user.id,
            phoneNumber: user.phone
          });
          setIsLoggedIn(true);
        } catch (error) {
          console.error("AuthContext: Error checking auth:", error);
          logout(); // Invalid token, so logout
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", { phone: phoneNumber, password });
      
      const loggedInUser: User = {
        ...response.user,
        id: response.user._id || response.user.id,
        phoneNumber: response.user.phone
      };
      
      sessionStorage.setItem("authToken", response.access_token);
      setCurrentUser(loggedInUser);
      setIsLoggedIn(true);
      showSuccess("Logged in successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      showError(error.message || "Invalid phone number or password.");
      throw error;
    }
  };

  const signup = async (name: string, phoneNumber: string, password: string) => {
    try {
      await api.post<AuthResponse>("/auth/signup", { name, phone: phoneNumber, password });
      
      showSuccess("Account created successfully! Please log in.");
      navigate("/login");
    } catch (error: any) {
      console.error("AuthContext: Signup error:", error);
      showError(error.message || "Failed to create account.");
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem("authToken");
    showSuccess("Logged out successfully.");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};