"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarFront, CalendarDays, MapPin, UserRound, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { matchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Map } from "@/components/ui/Map";
import { AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { RideMatch, RideMatchStatus } from "@/types";

const MapBoundsUpdater = ({ matches }: { matches: RideMatch[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || matches.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidPoints = false;

    matches.forEach(match => {
      const dest = match.schedule?.destination;
      const position = dest?.geo ? dest.geo :
        (dest?.latitude && dest?.longitude) ? { lat: dest.latitude, lng: dest.longitude } :
          null;

      if (position) {
        bounds.extend(position);
        hasValidPoints = true;
      }
    });

    if (hasValidPoints) {
      map.fitBounds(bounds);
      
      // If there's only one point, zoom out a bit so it's not too close
      if (matches.length === 1) {
         // Use a timeout to ensure fitBounds has finished before overriding zoom
         setTimeout(() => {
           map.setZoom(14);
         }, 100);
      }
    }
  }, [map, matches]);

  return null;
};

const RideMatchesPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<RideMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<RideMatch | null>(null);

  const selectedMatchPosition = selectedMatch?.schedule?.destination?.geo ||
    (selectedMatch?.schedule?.destination?.latitude && selectedMatch?.schedule?.destination?.longitude
      ? { lat: selectedMatch.schedule.destination.latitude, lng: selectedMatch.schedule.destination.longitude }
      : null);

  const fetchMatches = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchMatches();
    }
  }, [currentUser, fetchMatches]);

  const handleStatusUpdate = async (matchId: string, newStatus: RideMatchStatus) => {
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
          <Tabs defaultValue="list" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="map">Map View</TabsTrigger>
              </TabsList>
              <Button onClick={fetchMatches} disabled={isLoading}>
                <CarFront className="mr-2 h-4 w-4" /> Refresh Matches
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : matches.length > 0 ? (
              <>
                <TabsContent value="list">
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
                        const matchId = match.id || match._id || "";
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
                </TabsContent>
                <TabsContent value="map">
                  <div className="h-[600px] w-full rounded-md overflow-hidden border">
                    <Map defaultCenter={{ lat: 34.0522, lng: -118.2437 }} defaultZoom={10}>
                      <MapBoundsUpdater matches={matches} />
                      {matches.map(match => {
                        const dest = match.schedule?.destination;
                        const position = dest?.geo ? dest.geo :
                                       (dest?.latitude && dest?.longitude) ? { lat: dest.latitude, lng: dest.longitude } :
                                       null;
                        if (!position) return null;
                        const matchId = match.id || match._id || "";

                        return (
                          <AdvancedMarker
                            key={matchId}
                            position={position}
                            onClick={() => setSelectedMatch(match)}
                          >
                            <div className="relative flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                              <MapPin className="h-10 w-10 text-blue-600 fill-white drop-shadow-md" />
                            </div>
                          </AdvancedMarker>
                        );
                      })}
                      {selectedMatch && selectedMatchPosition && (
                        <InfoWindow
                          position={selectedMatchPosition}
                          onCloseClick={() => setSelectedMatch(null)}
                        >
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold mb-2">{selectedMatch.schedule?.destination?.name}</h3>
                            <p className="text-sm mb-1">
                              <strong>Child:</strong> {selectedMatch.schedule?.child_name}
                            </p>
                            <p className="text-sm mb-1">
                              <strong>Time:</strong> {selectedMatch.schedule?.pickup_time ? format(parseISO(selectedMatch.schedule.pickup_time), "MMM dd, hh:mm a") : "N/A"}
                            </p>
                            <p className="text-sm mb-2">
                              <strong>Status:</strong> {selectedMatch.status}
                            </p>
                            {selectedMatch.status === 'suggested' && (
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => handleStatusUpdate(selectedMatch.id || selectedMatch._id || "", 'accepted')}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(selectedMatch.id || selectedMatch._id || "", 'declined')}>
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </div>
                </TabsContent>
              </>
            ) : (
              <div className="mt-6 p-4 border rounded-md bg-secondary/20 text-muted-foreground">
                No ride matches found yet. Matches appear here when your schedule overlaps with a tribe member.
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideMatchesPage;