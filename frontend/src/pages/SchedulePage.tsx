"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, MapPin, Clock, Repeat, Loader2, Trash2, Pencil, Search, Calendar } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case "once": return "One-time";
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      default: return recurrence;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage your children's upcoming trips.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20" onClick={handleCreateClick}>
              <CalendarPlus className="mr-2 h-5 w-5" /> Schedule Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
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
                      {destinations.length > 0 ? destinations.map(d => {
                        const id = d.id || d._id;
                        if (!id) return null;
                        return (
                          <SelectItem key={id} value={id}>{d.name}</SelectItem>
                        );
                      }) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No destinations found. Add one first!
                        </div>
                      )}
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
                  {editingId ? "Update Trip" : "Schedule Trip"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between">
             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by child, destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background h-9"
                />
             </div>
          </div>

          {isLoading ? (
             <div className="flex justify-center p-12">
               <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
             </div>
          ) : schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-6">Child</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.filter(entry => {
                  const destination = entry.destination;
                  const pickupTime = entry.pickup_time ? parseISO(entry.pickup_time) : new Date();
                  const timeStr = format(pickupTime, "MMM dd, hh:mm a").toLowerCase();
                  const query = searchQuery.toLowerCase();
                  
                  return (
                    entry.child_name.toLowerCase().includes(query) ||
                    (destination?.name || "").toLowerCase().includes(query) ||
                    (destination?.address || "").toLowerCase().includes(query) ||
                    timeStr.includes(query)
                  );
                }).map(entry => {
                  const destination = entry.destination;
                  const pickupTime = entry.pickup_time ? parseISO(entry.pickup_time) : new Date();
                  
                  return (
                    <TableRow key={entry._id || entry.id} className="group hover:bg-muted/30">
                      <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {entry.child_name.charAt(0)}
                           </div>
                           {entry.child_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{destination?.name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{destination?.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="font-medium">{format(pickupTime, "h:mm a")}</span>
                           <span className="text-xs text-muted-foreground">{format(pickupTime, "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal capitalize bg-background">
                          {getRecurrenceLabel(entry.recurrence)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusVariant(entry.status)} className="capitalize shadow-sm">
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(entry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(entry._id || entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium text-foreground">No trips scheduled</p>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Add your child's first trip to start finding ride matches.
              </p>
              <Button variant="outline" onClick={handleCreateClick}>
                Schedule First Trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;
