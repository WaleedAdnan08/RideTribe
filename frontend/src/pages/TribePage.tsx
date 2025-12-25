"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Phone, Loader2, Users, Trash2, Pencil, Search, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [phoneError, setPhoneError] = useState("");

  const handleInvitePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setInviteData({ ...inviteData, phoneNumber: value });
    if (value.length > 0 && value.length !== 11) {
      setPhoneError("Invalid Phone Number");
    } else {
      setPhoneError("");
    }
  };

  // Edit Trust Level State
  const [isEditTrustDialogOpen, setIsEditTrustDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<{ tribeId: string; member: TribeMember } | null>(null);
  const [newTrustLevel, setNewTrustLevel] = useState<TrustLevel>("direct");
  const [isUpdatingTrust, setIsUpdatingTrust] = useState(false);

  // Delete Member State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ tribeId: string; member: TribeMember } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTribes = async () => {
    try {
      setIsLoading(true);
      const rawData = await tribeApi.list();
      const data = rawData.map((t: any) => ({
        ...t,
        id: t.id || t._id
      }));
      setTribes(data);
      
      const membersData: Record<string, TribeMember[]> = {};
      for (const tribe of data) {
        if (!tribe.id) continue;
        try {
          const rawMembers = await tribeApi.getMembers(tribe.id);
          const members = rawMembers.map((m: any) => ({
            ...m,
            user: {
              ...m.user,
              id: m.user.id || m.user._id
            }
          }));
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
    if (!selectedTribeId || !inviteData.phoneNumber) return;

    if (inviteData.phoneNumber.length !== 11) {
      setPhoneError("Invalid Phone Number");
      return;
    }

    try {
      setIsInviting(true);
      const rawNewMember = await tribeApi.invite(selectedTribeId, inviteData.phoneNumber, inviteData.trustLevel);
      const newMember = {
        ...rawNewMember,
        user: {
          ...rawNewMember.user,
          id: rawNewMember.user.id || rawNewMember.user._id
        }
      };
      
      toast({ title: "Success", description: "Invite sent successfully!" });
      
      setTribeMembers(prev => ({
        ...prev,
        [selectedTribeId]: [...(prev[selectedTribeId] || []), newMember]
      }));
      
      setIsInviteDialogOpen(false);
      setInviteData({ phoneNumber: "", trustLevel: "direct" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite member.",
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

  const openEditTrustDialog = (tribeId: string, member: TribeMember) => {
    setMemberToEdit({ tribeId, member });
    setNewTrustLevel(member.trust_level);
    setIsEditTrustDialogOpen(true);
  };

  const handleUpdateTrust = async () => {
    if (!memberToEdit) return;

    try {
      setIsUpdatingTrust(true);
      await tribeApi.updateMemberTrust(memberToEdit.tribeId, memberToEdit.member.user.id, newTrustLevel);
      
      toast({ title: "Success", description: "Trust level updated successfully!" });
      
      setTribeMembers(prev => ({
        ...prev,
        [memberToEdit.tribeId]: prev[memberToEdit.tribeId].map(m =>
          m.user.id === memberToEdit.member.user.id
            ? { ...m, trust_level: newTrustLevel }
            : m
        )
      }));
      
      setIsEditTrustDialogOpen(false);
      setMemberToEdit(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update trust level.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTrust(false);
    }
  };

  const confirmDeleteMember = (tribeId: string, member: TribeMember) => {
    setMemberToDelete({ tribeId, member });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setIsDeleting(true);
      const userId = memberToDelete.member.user.id || memberToDelete.member.user._id;
      await tribeApi.removeMember(memberToDelete.tribeId, userId);
      
      toast({ title: "Success", description: "Member removed successfully!" });
      
      setTribeMembers(prev => ({
        ...prev,
        [memberToDelete.tribeId]: prev[memberToDelete.tribeId].filter(
          m => (m.user.id || m.user._id) !== userId
        )
      }));
      
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getTrustIcon = (level: TrustLevel) => {
    switch (level) {
      case "direct": return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case "activity-specific": return <Shield className="h-4 w-4 text-blue-600" />;
      case "emergency-only": return <ShieldAlert className="h-4 w-4 text-amber-600" />;
      default: return null;
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tribes</h1>
          <p className="text-muted-foreground mt-1">Manage your trusted carpooling circles.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Tribe
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
                <div className="space-y-2">
                  <Label htmlFor="name">Tribe Name</Label>
                  <Input
                    id="name"
                    value={newTribeName}
                    onChange={(e) => setNewTribeName(e.target.value)}
                    placeholder="e.g. Neighborhood Carpool"
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
        <div className="flex justify-center p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        </div>
      ) : tribes.length > 0 ? (
        <div className="space-y-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-sm bg-background/50 backdrop-blur-sm"
            />
          </div>
          
          {/* Pending Invites Section */}
          {tribes.filter(t => t.membership_status === 'invited').length > 0 && (
             <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-600">
                   <ShieldAlert className="h-5 w-5" /> Pending Invites
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                   {tribes.filter(t => t.membership_status === 'invited').map(tribe => (
                      <Card key={tribe.id} className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                         <CardHeader className="pb-3">
                            <CardTitle className="flex justify-between items-start">
                               <span>{tribe.name}</span>
                               <Badge variant="outline" className="border-amber-400 text-amber-700">Invited</Badge>
                            </CardTitle>
                            <CardDescription>
                               You have been invited to join this tribe{tribe.invited_by_name ? ` by ${tribe.invited_by_name}` : ""}.
                            </CardDescription>
                         </CardHeader>
                         <CardContent className="flex gap-2 justify-end">
                            <Button
                               size="sm"
                               variant="outline"
                               className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                               onClick={async () => {
                                  try {
                                     await tribeApi.respondToInvite(tribe.id, 'declined');
                                     toast({ title: "Invite Declined", variant: "default" });
                                     fetchTribes();
                                  } catch (error) {
                                     toast({ title: "Error", description: "Failed to decline invite", variant: "destructive" });
                                  }
                               }}
                            >
                               Decline
                            </Button>
                            <Button
                               size="sm"
                               className="bg-green-600 hover:bg-green-700 text-white"
                               onClick={async () => {
                                  try {
                                     await tribeApi.respondToInvite(tribe.id, 'accepted');
                                     toast({ title: "Invite Accepted", description: `You joined ${tribe.name}` });
                                     fetchTribes();
                                  } catch (error) {
                                     toast({ title: "Error", description: "Failed to accept invite", variant: "destructive" });
                                  }
                               }}
                            >
                               Accept
                            </Button>
                         </CardContent>
                      </Card>
                   ))}
                </div>
             </div>
          )}

          {/* Active Tribes List */}
          {tribes.filter(t => t.membership_status === 'accepted' || t.membership_status === undefined).map(tribe => {
            const filteredMembers = tribeMembers[tribe.id]?.filter(member =>
              member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              member.user.phone.includes(searchQuery)
            ) || [];

            if (searchQuery && filteredMembers.length === 0) return null;

            return (
              <Card key={tribe.id} className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-secondary/30">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                       <Users className="h-5 w-5 text-primary" />
                       {tribe.name}
                    </CardTitle>
                    <CardDescription>{tribeMembers[tribe.id]?.length || 0} members</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openInviteDialog(tribe.id)} className="border-dashed border-primary/30 text-primary hover:bg-primary/5">
                    <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[80px] pl-6">Avatar</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Trust Level</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        {tribe.owner_id === currentUser?.id && (
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member, index) => (
                        <TableRow key={index} className="group hover:bg-muted/50">
                          <TableCell className="pl-6">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {member.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{member.user.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" /> {member.user.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                                {getTrustIcon(member.trust_level)}
                                <span className="capitalize text-sm">{member.trust_level.replace(/-/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={getStatusVariant(member.status)} className="capitalize shadow-sm">
                              {member.status}
                            </Badge>
                          </TableCell>
                          {tribe.owner_id === currentUser?.id && (
                            <TableCell className="text-right pr-6">
                              {member.user.id !== tribe.owner_id && (
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={() => openEditTrustDialog(tribe.id, member)}
                                    title="Edit Trust Level"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => confirmDeleteMember(tribe.id, member)}
                                    title="Remove Member"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-secondary/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
               <Users className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Tribes Yet</h3>
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
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={inviteData.phoneNumber}
                  onChange={handleInvitePhoneChange}
                  placeholder="11-digit phone number"
                  minLength={11}
                  maxLength={11}
                  className={phoneError ? "border-destructive" : ""}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {inviteData.phoneNumber.length}/11 digits
                  </p>
                  {phoneError && (
                    <p className="text-xs text-destructive font-medium">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trust">Trust Level</Label>
                <Select 
                  value={inviteData.trustLevel} 
                  onValueChange={(val: TrustLevel) => setInviteData({ ...inviteData, trustLevel: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trust level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">
                        <div className="flex items-center gap-2">
                             <ShieldCheck className="w-4 h-4 text-green-500" />
                             <span>Direct (High Trust)</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="activity-specific">
                        <div className="flex items-center gap-2">
                             <Shield className="w-4 h-4 text-blue-500" />
                             <span>Activity Specific</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="emergency-only">
                        <div className="flex items-center gap-2">
                             <ShieldAlert className="w-4 h-4 text-amber-500" />
                             <span>Emergency Only</span>
                        </div>
                    </SelectItem>
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

      {/* Edit Trust Level Dialog */}
      <Dialog open={isEditTrustDialogOpen} onOpenChange={setIsEditTrustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trust Level</DialogTitle>
            <DialogDescription>
              Change the trust level for {memberToEdit?.member.user.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-trust">Trust Level</Label>
              <Select
                value={newTrustLevel}
                onValueChange={(val: TrustLevel) => setNewTrustLevel(val)}
              >
                <SelectTrigger>
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
            <Button variant="outline" onClick={() => setIsEditTrustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTrust} disabled={isUpdatingTrust}>
              {isUpdatingTrust && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.member.user.name} from this tribe?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteMember();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TribePage;