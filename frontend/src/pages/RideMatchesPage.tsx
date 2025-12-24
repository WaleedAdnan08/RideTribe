"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarFront, CalendarDays, MapPin, UserRound, Loader2, Check, X, Navigation, Clock } from "lucide-react";
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
    let pointCount = 0;
    let singlePoint = null;

    matches.forEach(match => {
      const dest = match.schedule?.destination;
      const position = dest?.geo ? dest.geo :
        (dest?.latitude && dest?.longitude) ? { lat: dest.latitude, lng: dest.longitude } :
          null;

      if (position) {
        bounds.extend(position);
        hasValidPoints = true;
        pointCount++;
        singlePoint = position;
      }
    });

    if (hasValidPoints) {
      if (pointCount === 1 && singlePoint) {
        map.setCenter(singlePoint);
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
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
      case "suggested": return "secondary"; // Blue/Gray
      case "accepted": return "default"; // Primary/Dark
      case "declined": return "destructive"; // Red
      case "completed": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ride Matches</h1>
          <p className="text-muted-foreground mt-1">Review and coordinate carpooling opportunities.</p>
        </div>
        <Button onClick={fetchMatches} disabled={isLoading} variant="outline" className="shadow-sm">
          <CarFront className="mr-2 h-4 w-4" /> Refresh Matches
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Tabs defaultValue="list" className="w-full">
            <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
              <TabsList className="bg-background/80">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="map">Map View</TabsTrigger>
              </TabsList>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
              </div>
            ) : matches.length > 0 ? (
              <>
                <TabsContent value="list" className="m-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="pl-6">Match Details</TableHead>
                        <TableHead>People Involved</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
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
                          <TableRow key={matchId} className="group hover:bg-muted/30">
                            <TableCell className="pl-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-foreground">
                                  {scheduleEntry?.child_name || "Unknown"}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {scheduleEntry?.pickup_time ? format(parseISO(scheduleEntry.pickup_time), "MMM dd, h:mm a") : "N/A"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground text-xs uppercase tracking-wide w-16">Requester</span>
                                  <span className="font-medium">{requester?.name || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground text-xs uppercase tracking-wide w-16">Provider</span>
                                  <span className="font-medium">{provider?.name || "Unknown"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{destination?.name || "Unknown"}</span>
                                {!(destination?.geo || (destination?.latitude && destination?.longitude)) && (
                                  <span title="Location data missing" className="text-amber-500 cursor-help ml-1">⚠️</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(match.status)} className="capitalize shadow-sm">
                                {match.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {match.status === 'suggested' ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 shadow-sm"
                                    onClick={() => handleStatusUpdate(matchId, 'accepted')}
                                    disabled={isProcessing}
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-3"
                                    onClick={() => handleStatusUpdate(matchId, 'declined')}
                                    disabled={isProcessing}
                                  >
                                    <X className="h-4 w-4 mr-1" /> Decline
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">No actions</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="map" className="m-0 p-0">
                  <div className="h-[600px] w-full bg-muted/20 relative">
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
                            <div className="relative group cursor-pointer">
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 blur-[2px] rounded-full" />
                              <div className="relative bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 transition-transform ring-2 ring-white dark:ring-slate-900">
                                <CarFront className="h-5 w-5" />
                              </div>
                            </div>
                          </AdvancedMarker>
                        );
                      })}
                      {selectedMatch && selectedMatchPosition && (
                        <InfoWindow
                          position={selectedMatchPosition}
                          onCloseClick={() => setSelectedMatch(null)}
                          maxWidth={300}
                        >
                          <div className="p-1">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/10">
                               <MapPin className="h-4 w-4 text-primary" />
                               <h3 className="font-bold text-sm">{selectedMatch.schedule?.destination?.name}</h3>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Child:</span>
                                <span className="font-medium">{selectedMatch.schedule?.child_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Time:</span>
                                <span>{selectedMatch.schedule?.pickup_time ? format(parseISO(selectedMatch.schedule.pickup_time), "h:mm a") : "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <Badge variant={getStatusVariant(selectedMatch.status)} className="capitalize text-xs">
                                  {selectedMatch.status}
                                </Badge>
                              </div>
                            </div>
                            {selectedMatch.status === 'suggested' && (
                              <div className="flex gap-2 mt-3 pt-2 border-t border-border/10">
                                <Button size="sm" className="w-full h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(selectedMatch.id || selectedMatch._id || "", 'accepted')}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={() => handleStatusUpdate(selectedMatch.id || selectedMatch._id || "", 'declined')}>
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
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Navigation className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-lg font-medium text-foreground">No matches found</p>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Matches appear here when your schedule overlaps with a tribe member's trip.
                </p>
                <Button variant="outline" onClick={fetchMatches}>
                  Check Again
                </Button>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideMatchesPage;