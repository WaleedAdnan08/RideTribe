"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarFront, CalendarDays, MapPin, UserRound, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { matchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const RideMatchesPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      const data = await matchesApi.list();
      setMatches(data);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      toast({
        title: "Error",
        description: "Failed to load ride matches.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchMatches();
    }
  }, [currentUser]);

  const handleStatusUpdate = async (matchId: string, newStatus: string) => {
    try {
      setProcessingId(matchId);
      await matchesApi.updateStatus(matchId, newStatus);
      toast({ title: "Success", description: `Match ${newStatus}` });
      
      // Update local state
      setMatches(prev => prev.map(m =>
        (m._id === matchId || m.id === matchId) ? { ...m, status: newStatus } : m
      ));
    } catch (error) {
      console.error("Update failed", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "suggested": return "secondary";
      case "accepted": return "default";
      case "declined": return "destructive";
      case "completed": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Ride Matches</CardTitle>
          <CardDescription>View suggested carpooling opportunities.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            This page shows automatic ride suggestions based on your tribe's schedules.
          </p>
          <Button className="mb-6" onClick={fetchMatches} disabled={isLoading}>
            <CarFront className="mr-2 h-4 w-4" /> Refresh Matches
          </Button>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : matches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match For</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map(match => {
                  const scheduleEntry = match.schedule;
                  const destination = scheduleEntry?.destination;
                  const requester = match.requester;
                  const provider = match.provider;
                  const matchId = match._id || match.id;
                  const isProcessing = processingId === matchId;

                  return (
                    <TableRow key={matchId}>
                      <TableCell className="font-medium">
                        {scheduleEntry?.child_name || "N/A"}
                        <p className="text-xs text-muted-foreground">
                          {scheduleEntry?.pickup_time ? format(parseISO(scheduleEntry.pickup_time), "MMM dd, hh:mm a") : "N/A"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserRound className="h-3 w-3 text-muted-foreground" />
                          {requester?.name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserRound className="h-3 w-3 text-muted-foreground" />
                          {provider?.name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {destination?.name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(match.status)}>
                          {match.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {match.status === 'suggested' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-green-200 hover:bg-green-50 hover:text-green-600"
                              onClick={() => handleStatusUpdate(matchId, 'accepted')}
                              disabled={isProcessing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleStatusUpdate(matchId, 'declined')}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-6 p-4 border rounded-md bg-secondary/20 text-muted-foreground">
              No ride matches found yet. Matches appear here when your schedule overlaps with a tribe member.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RideMatchesPage;