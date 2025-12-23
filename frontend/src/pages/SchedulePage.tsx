"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, MapPin, Clock, Repeat, Loader2, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { schedulesApi, destinationsApi } from "@/lib/api";
import { ScheduleEntry, Destination } from "@/types";

const SchedulePage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    child_name: "",
    destination_id: "",
    pickup_date: "",
    recurrence: "once"
  });

  const [timeState, setTimeState] = useState({
    hour: "12",
    minute: "00",
    period: "PM"
  });

  const resetForm = () => {
    setFormData({
      child_name: "",
      destination_id: "",
      pickup_date: "",
      recurrence: "once"
    });
    setTimeState({ hour: "12", minute: "00", period: "PM" });
    setEditingId(null);
  };

  const handleCreateClick = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditClick = (schedule: any) => {
    // Parse the date to split into date and time
    let dateStr = "";
    
    if (schedule.pickup_time) {
      const date = parseISO(schedule.pickup_time);
      dateStr = format(date, "yyyy-MM-dd");
      
      // Parse 12-hour format parts
      const hour24 = date.getHours();
      const period = hour24 >= 12 ? "PM" : "AM";
      const hour12 = hour24 % 12 || 12; // Convert 0 to 12
      const minute = date.getMinutes().toString().padStart(2, "0");

      setTimeState({
        hour: hour12.toString(),
        minute: minute,
        period: period
      });
    }

    setFormData({
      child_name: schedule.child_name,
      destination_id: schedule.destination_id,
      pickup_date: dateStr,
      recurrence: schedule.recurrence || "once"
    });
    setEditingId(schedule.id || schedule._id);
    setIsDialogOpen(true);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [schedulesData, destinationsData] = await Promise.all([
        schedulesApi.list(),
        destinationsApi.list()
      ]);
      setSchedules(schedulesData);
      setDestinations(destinationsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load schedules.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.child_name || !formData.destination_id || !formData.pickup_date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      // Convert 12h parts to 24h string
      let hour24 = parseInt(timeState.hour);
      if (timeState.period === "PM" && hour24 !== 12) hour24 += 12;
      if (timeState.period === "AM" && hour24 === 12) hour24 = 0;
      
      const timeStr = `${hour24.toString().padStart(2, "0")}:${timeState.minute}`;
      
      // Robust Date Construction (forces Local Time interpretation)
      // Parse YYYY-MM-DD
      const [year, month, day] = formData.pickup_date.split("-").map(Number);
      
      // Create date using (Year, MonthIndex, Day, Hour, Minute)
      // Month is 0-indexed in JS Date
      const date = new Date(year, month - 1, day, hour24, parseInt(timeState.minute));
      
      const isoDate = date.toISOString();

      console.log("DEBUG: Time Selection Details:", {
        inputState: timeState,
        calculatedTimeStr: timeStr,
        pickupDate: formData.pickup_date,
        generatedDateObj: date.toString(),
        finalISO: isoDate
      });

      const { pickup_date, ...submitData } = formData;
      const apiData = {
        ...submitData,
        pickup_time: isoDate,
        dropoff_time: isoDate
      };

      if (editingId) {
        await schedulesApi.update(editingId, apiData);
        toast({ title: "Success", description: "Trip updated successfully!" });
      } else {
        await schedulesApi.create(apiData);
        toast({ title: "Success", description: "Trip scheduled successfully!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save schedule.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    try {
      await schedulesApi.delete(id);
      setSchedules(prev => prev.filter(s => s._id !== id && s.id !== id));
      toast({ title: "Deleted", description: "Trip removed." });
    } catch (error: any) {
      console.error("Delete failed", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete trip.",
        variant: "destructive"
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">My Schedule</CardTitle>
          <CardDescription>Manage your children's transportation schedules.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            This page displays your family's upcoming trips.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mb-6" onClick={handleCreateClick}>
                <CalendarPlus className="mr-2 h-4 w-4" /> Add New Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Trip" : "Schedule a Trip"}</DialogTitle>
                <DialogDescription>{editingId ? "Update existing trip details." : "Add a new transportation need for your child."}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Child Name</Label>
                    <Input
                      value={formData.child_name}
                      onChange={e => setFormData(prev => ({...prev, child_name: e.target.value}))}
                      className="col-span-3"
                      placeholder="e.g. Leo"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Destination</Label>
                    <Select
                      value={formData.destination_id}
                      onValueChange={val => setFormData(prev => ({...prev, destination_id: val}))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map(d => {
                          const id = d.id || d._id;
                          if (!id) return null;
                          return (
                            <SelectItem key={id} value={id}>{d.name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date</Label>
                    <Input
                      type="date"
                      className="col-span-3"
                      value={formData.pickup_date}
                      onChange={e => setFormData(prev => ({...prev, pickup_date: e.target.value}))}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Time</Label>
                    <div className="col-span-3 flex gap-2">
                      {/* Hour Selector */}
                      <Select
                        value={timeState.hour}
                        onValueChange={val => setTimeState(prev => ({...prev, hour: val}))}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="h-[200px]">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <SelectItem key={h} value={h.toString()}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Minute Selector */}
                      <Select
                        value={timeState.minute}
                        onValueChange={val => setTimeState(prev => ({...prev, minute: val}))}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Period Selector */}
                      <Select
                        value={timeState.period}
                        onValueChange={val => setTimeState(prev => ({...prev, period: val}))}
                      >
                        <SelectTrigger className="w-[80px]">
                          <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Recurrence</Label>
                    <Select
                      value={formData.recurrence}
                      onValueChange={val => setFormData(prev => ({...prev, recurrence: val}))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">One-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Trip
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {isLoading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(entry => {
                  // entry.destination is enriched by backend
                  const destination = entry.destination;
                  const pickupTime = entry.pickup_time ? parseISO(entry.pickup_time) : new Date();
                  
                  // Debug log for display (can be removed later)
                  // console.log(`DEBUG: Row ${entry.child_name}`, { raw: entry.pickup_time, parsed: pickupTime.toString() });

                  return (
                    <TableRow key={entry._id || entry.id}>
                      <TableCell className="font-medium">{entry.child_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {destination?.name || "Unknown Destination"}
                        </div>
                        <p className="text-xs text-muted-foreground">{destination?.address}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(pickupTime, "MMM dd, hh:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                          {entry.recurrence}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusVariant(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(entry)}>
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(entry._id || entry.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="mt-6 p-4 border rounded-md bg-secondary/20 text-muted-foreground">
              No scheduled trips yet. Start by adding your first trip!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;
