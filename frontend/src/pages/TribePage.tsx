"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Phone, Loader2, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { tribeApi } from "@/lib/api";
import { Tribe, TrustLevel, TribeMembershipStatus, TribeMember } from "@/types";

const TribePage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [tribeMembers, setTribeMembers] = useState<Record<string, TribeMember[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Tribe Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTribeName, setNewTribeName] = useState("");

  // Invite Member Dialog State
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState({
    phoneNumber: "",
    trustLevel: "direct" as TrustLevel
  });

  const fetchTribes = async () => {
    try {
      setIsLoading(true);
      const rawData = await tribeApi.list();
      // Map _id to id if necessary
      const data = rawData.map((t: any) => ({
        ...t,
        id: t.id || t._id
      }));
      setTribes(data);
      
      // Fetch members for each tribe
      const membersData: Record<string, TribeMember[]> = {};
      for (const tribe of data) {
        if (!tribe.id) continue;
        try {
          const members = await tribeApi.getMembers(tribe.id);
          membersData[tribe.id] = members;
        } catch (err) {
          console.error(`Failed to fetch members for tribe ${tribe.id}`, err);
        }
      }
      setTribeMembers(membersData);
    } catch (error) {
      console.error("Failed to fetch tribes:", error);
      toast({
        title: "Error",
        description: "Failed to load tribes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTribes();
    }
  }, [currentUser]);

  const handleCreateTribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTribeName.trim()) return;

    try {
      setIsCreating(true);
      await tribeApi.create(newTribeName);
      toast({ title: "Success", description: "Tribe created successfully!" });
      setNewTribeName("");
      setIsCreateDialogOpen(false);
      fetchTribes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tribe.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleInvite called", { selectedTribeId, inviteData });
    if (!selectedTribeId || !inviteData.phoneNumber) {
      console.warn("Missing required data for invite", { selectedTribeId, phoneNumber: inviteData.phoneNumber });
      return;
    }

    try {
      setIsInviting(true);
      console.log("Calling tribeApi.invite...");
      const newMember = await tribeApi.invite(selectedTribeId, inviteData.phoneNumber, inviteData.trustLevel);
      console.log("Invite successful", newMember);
      toast({ title: "Success", description: "Invite sent successfully!" });
      
      // Optimistically update the UI with the new member from the response
      setTribeMembers(prev => ({
        ...prev,
        [selectedTribeId]: [...(prev[selectedTribeId] || []), newMember]
      }));
      
      setIsInviteDialogOpen(false);
      setInviteData({ phoneNumber: "", trustLevel: "direct" });
    } catch (error: any) {
      console.error("Invite failed", error);
      toast({
        title: "Error",
        description: error.message || "Failed to invite member. Make sure they are registered.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const openInviteDialog = (tribeId: string) => {
    setSelectedTribeId(tribeId);
    setIsInviteDialogOpen(true);
  };

  const getTrustLevelVariant = (level: TrustLevel) => {
    switch (level) {
      case "direct": return "default";
      case "activity-specific": return "secondary";
      case "emergency-only": return "outline";
      default: return "secondary";
    }
  };

  const getStatusVariant = (status: TribeMembershipStatus) => {
    switch (status) {
      case "accepted": return "default";
      case "pending": return "secondary";
      case "declined": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Tribes</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Tribe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Tribe</DialogTitle>
              <DialogDescription>
                Create a group to manage your carpooling circles (e.g., "Soccer Parents", "School Run").
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTribe}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={newTribeName}
                    onChange={(e) => setNewTribeName(e.target.value)}
                    placeholder="e.g. Neighborhood Carpool"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Tribe
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tribes.length > 0 ? (
        <div className="space-y-8">
          {tribes.map(tribe => (
            <Card key={tribe.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                  <CardTitle className="text-xl">{tribe.name}</CardTitle>
                  <CardDescription>{tribeMembers[tribe.id]?.length || 0} members</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openInviteDialog(tribe.id)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Member</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Trust Level</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tribeMembers[tribe.id]?.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{member.user.name}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" /> {member.user.phone}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTrustLevelVariant(member.trust_level)}>
                            {member.trust_level.replace(/-/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getStatusVariant(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tribes Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create a tribe to start managing your trusted drivers and carpooling groups.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Tribe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Tribe</DialogTitle>
            <DialogDescription>
              Add a trusted family to this tribe. They must already be registered.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone</Label>
                <Input
                  id="phone"
                  value={inviteData.phoneNumber}
                  onChange={(e) => setInviteData({ ...inviteData, phoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="trust" className="text-right">Trust Level</Label>
                <Select 
                  value={inviteData.trustLevel} 
                  onValueChange={(val: TrustLevel) => setInviteData({ ...inviteData, trustLevel: val })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select trust level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct (High Trust)</SelectItem>
                    <SelectItem value="activity-specific">Activity Specific</SelectItem>
                    <SelectItem value="emergency-only">Emergency Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isInviting}>
                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TribePage;