"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PlusCircle, Globe, Loader2, Trash2, Pencil, Search, Building2, Home, School, FerrisWheel, Map as MapIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlaceAutocomplete } from "@/components/ui/PlaceAutocomplete";
import api, { destinationsApi } from "@/lib/api";
import { Destination, Geo } from "@/types";

const DestinationsPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    category: string;
    google_place_id?: string;
    geo?: Geo;
  }>({
    name: "",
    address: "",
    category: "Activity",
  });

  const fetchDestinations = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Destination[]>("/destinations");
      setDestinations(data);
    } catch (error) {
      console.error("Failed to fetch destinations:", error);
      toast({
        title: "Error",
        description: "Failed to load destinations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDestinations();
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", category: "Activity" });
    setEditingId(null);
  };

  const handleEditClick = (dest: Destination) => {
    setFormData({
      name: dest.name,
      address: dest.address,
      category: dest.category || "Activity",
      google_place_id: dest.google_place_id,
      geo: dest.geo
    });
    setEditingId(dest.id || dest._id || null);
    setIsDialogOpen(true);
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    setFormData(prev => ({
      ...prev,
      address: place.formatted_address || prev.address,
      name: (!prev.name && place.name) ? place.name : prev.name, // Auto-fill name if empty
      google_place_id: place.place_id,
      geo: place.geometry?.location ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      } : undefined
    }));
  };

  const handleCreateClick = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    
    try {
      await destinationsApi.delete(id);
      setDestinations(prev => prev.filter(d => (d.id || d._id) !== id));
      toast({
        title: "Deleted",
        description: "Destination removed successfully.",
      });
    } catch (error) {
      console.error("Failed to delete destination:", error);
      toast({
        title: "Error",
        description: "Failed to delete destination.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Name and Address are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingId) {
        // Update existing
        await destinationsApi.update(editingId, formData);
        toast({
          title: "Success",
          description: "Destination updated successfully!",
        });
      } else {
        // Create new
        await api.post<Destination>("/destinations", formData);
        toast({
          title: "Success",
          description: "Destination added successfully!",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchDestinations(); // Refresh list
    } catch (error) {
      console.error("Failed to save destination:", error);
      toast({
        title: "Error",
        description: "Failed to save destination. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "School": return <School className="h-4 w-4 text-blue-500" />;
      case "Home": return <Home className="h-4 w-4 text-green-500" />;
      case "Sports": return <FerrisWheel className="h-4 w-4 text-orange-500" />;
      case "Activity": return <FerrisWheel className="h-4 w-4 text-purple-500" />;
      default: return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Destinations</h1>
          <p className="text-muted-foreground mt-1">Manage common locations for your carpooling needs.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20" onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Destination
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[500px]"
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest('.pac-container') ||
                target.closest('.pac-item') ||
                target.classList.contains('pac-container') ||
                target.classList.contains('pac-item')
              ) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Destination" : "Add Destination"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the details of this destination." : "Enter the details of the new destination here."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Lincoln High School"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <PlaceAutocomplete
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="e.g. 123 School Ln"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select onValueChange={handleCategoryChange} defaultValue={formData.category}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School">School</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Activity">Activity</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
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
                  placeholder="Search destinations..."
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
          ) : destinations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.filter(dest => 
                  dest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  dest.address.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((dest) => {
                  const id = dest.id || dest._id;
                  if (!id) return null;
                  return (
                    <TableRow key={id} className="group hover:bg-muted/30">
                      <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-2">
                           <div className="p-2 bg-secondary rounded-lg">
                              {getCategoryIcon(dest.category || "Other")}
                           </div>
                           {dest.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="text-sm">{dest.address}</span>
                           {(dest.geo || (dest.latitude && dest.longitude)) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Globe className="h-3 w-3" />
                              Verified Location
                            </span>
                           )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">{dest.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {dest.created_at ? format(parseISO(dest.created_at), "MMM d, yyyy") :
                        dest.verified_date ? format(parseISO(dest.verified_date), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(dest)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(id)}>
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
              <MapIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium text-foreground">No destinations added</p>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Add schools, sports fields, and activity centers to use them in your schedule.
              </p>
              <Button variant="outline" onClick={handleCreateClick}>
                Add First Destination
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DestinationsPage;