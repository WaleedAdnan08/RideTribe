"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PlusCircle, Globe, Loader2, Trash2, Pencil } from "lucide-react";
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

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Destinations</CardTitle>
          <CardDescription>Manage common locations for your carpooling needs.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Here you can add and manage frequently used destinations like schools and activity centers.
          </p>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mb-6" onClick={handleCreateClick}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Destination
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : destinations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.map((dest) => {
                  const id = dest.id || dest._id;
                  if (!id) return null;
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{dest.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {dest.address}
                        </div>
                        {(dest.geo || (dest.latitude && dest.longitude)) && (
                          <p className="text-xs text-muted-foreground">
                            <Globe className="inline-block h-3 w-3 mr-1" />
                            {dest.geo
                              ? `Lat: ${dest.geo.lat.toFixed(4)}, Lng: ${dest.geo.lng.toFixed(4)}`
                              : `Lat: ${dest.latitude?.toFixed(4)}, Lng: ${dest.longitude?.toFixed(4)}`
                            }
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{dest.category || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        {dest.created_at ? format(parseISO(dest.created_at), "MMM dd, yyyy") :
                        dest.verified_date ? format(parseISO(dest.verified_date), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(dest)}>
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(id)}>
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
              No destinations added yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DestinationsPage;