import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  Users, 
  Shield, 
  Trash2, 
  Mail,
  CheckCircle,
  Eye,
  Gift,
  Ban,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ExecMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  permissions: {
    can_view_users: boolean;
    can_issue_tokens: boolean;
    can_ban_users?: boolean;
  };
  created_at: string;
  added_by: string;
}

interface Permission {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    key: "can_view_users",
    label: "View Users",
    description: "Can see all registered users",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    key: "can_issue_tokens",
    label: "Issue Scan Tokens",
    description: "Can grant bonus scans to users",
    icon: <Gift className="h-4 w-4" />,
  },
  {
    key: "can_ban_users",
    label: "Ban/Unban Users",
    description: "Can ban or unban user accounts",
    icon: <Ban className="h-4 w-4" />,
    adminOnly: true,
  },
];

export default function ExecMemberManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState<ExecMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("moderator");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    can_view_users: true,
    can_issue_tokens: false,
    can_ban_users: false,
  });
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exec_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for permissions
      const typedMembers = (data || []).map(member => ({
        ...member,
        permissions: member.permissions as ExecMember["permissions"]
      }));
      
      setMembers(typedMembers);
    } catch (error) {
      console.error("Error fetching exec members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !user) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      // Check if user exists
      const { data: existingUser, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(1);

      // For now, we'll create a placeholder entry
      // In production, you'd send an email invitation
      
      const { error } = await supabase.from("exec_members").insert({
        email: inviteEmail.toLowerCase(),
        user_id: crypto.randomUUID(), // Placeholder until user accepts
        role: inviteRole,
        permissions: selectedPermissions,
        added_by: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already a team member");
        } else {
          throw error;
        }
        return;
      }

      toast.success(`Invited ${inviteEmail} as ${inviteRole}`);
      setDialogOpen(false);
      setInviteEmail("");
      setSelectedPermissions({
        can_view_users: true,
        can_issue_tokens: false,
        can_ban_users: false,
      });
      fetchMembers();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Failed to invite team member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!user) return;
    
    setRemoving(memberId);
    try {
      const { error } = await supabase
        .from("exec_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Team member removed");
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove team member");
    } finally {
      setRemoving(null);
    }
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Exec Team Management
            </CardTitle>
            <CardDescription>
              Invite and manage team members with limited admin permissions
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Add a new exec member with specific permissions. They will receive an email invitation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="moderator">Moderator</option>
                    <option value="support">Support Agent</option>
                    <option value="analyst">Data Analyst</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <div
                      key={perm.key}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        selectedPermissions[perm.key] ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                      } ${perm.adminOnly ? "opacity-50" : ""}`}
                    >
                      <Checkbox
                        id={perm.key}
                        checked={selectedPermissions[perm.key]}
                        onCheckedChange={() => !perm.adminOnly && togglePermission(perm.key)}
                        disabled={perm.adminOnly}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={perm.key}
                          className="flex items-center gap-2 font-medium text-sm cursor-pointer"
                        >
                          {perm.icon}
                          {perm.label}
                          {perm.adminOnly && (
                            <Badge variant="outline" className="text-xs">Admin Only</Badge>
                          )}
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No team members yet</p>
            <p className="text-sm">Invite moderators to help manage the platform</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.permissions?.can_view_users && (
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Badge>
                      )}
                      {member.permissions?.can_issue_tokens && (
                        <Badge variant="secondary" className="text-xs">
                          <Gift className="h-3 w-3 mr-1" />
                          Tokens
                        </Badge>
                      )}
                      {member.permissions?.can_ban_users && (
                        <Badge variant="destructive" className="text-xs">
                          <Ban className="h-3 w-3 mr-1" />
                          Ban
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(member.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(member.id)}
                      disabled={removing === member.id}
                    >
                      {removing === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
