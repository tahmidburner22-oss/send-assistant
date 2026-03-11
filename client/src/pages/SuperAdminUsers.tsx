import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Shield, Trash2, Edit2, Check, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  school_id: string | null;
  school_name?: string;
  subscription_plan?: string;
  licence_type?: string;
  email_verified: boolean;
  created_at: string;
}

interface UpdatePayload {
  userId: string;
  field: "role" | "subscription_plan";
  value: string;
}

export default function SuperAdminUsers() {
  const [, navigate] = useLocation();
  const { user } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<"role" | "subscription_plan" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only allow admin@adaptly.co.uk
  useEffect(() => {
    if (user?.email !== "admin@adaptly.co.uk") {
      navigate("/home");
    }
  }, [user, navigate]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("send_token")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateUser = async (userId: string, field: "role" | "subscription_plan", value: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("send_token")}`,
        },
        body: JSON.stringify({ field, value }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const updated = await res.json();
      setUsers(users.map((u) => (u.id === userId ? updated : u)));
      setSuccess(`User updated successfully`);
      setEditingId(null);
      setEditField(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("send_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(users.filter((u) => u.id !== userId));
      setSuccess("User deleted successfully");
      setDeleteUserId(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "mat_admin":
        return "bg-red-100 text-red-700";
      case "school_admin":
        return "bg-orange-100 text-orange-700";
      case "senco":
        return "bg-blue-100 text-blue-700";
      case "teacher":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPlanBadgeColor = (plan: string | undefined) => {
    switch (plan?.toLowerCase()) {
      case "premium":
      case "enterprise":
        return "bg-green-100 text-green-700";
      case "professional":
      case "mat":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-brand" />
            <h1 className="text-3xl font-bold">Super Admin: User Management</h1>
          </div>
          <p className="text-muted-foreground">
            View and control access for all users on the Adaptly platform
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-700">{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>Search by email or name</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-sm">{u.email}</TableCell>
                        <TableCell>{u.display_name}</TableCell>
                        <TableCell>
                          {editingId === u.id && editField === "role" ? (
                            <div className="flex gap-2">
                              <Select value={editValue} onValueChange={setEditValue}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mat_admin">MAT Admin</SelectItem>
                                  <SelectItem value="school_admin">School Admin</SelectItem>
                                  <SelectItem value="senco">SENCO</SelectItem>
                                  <SelectItem value="teacher">Teacher</SelectItem>
                                  <SelectItem value="ta">TA</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateUser(u.id, "role", editValue)}
                                className="h-9 w-9 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditField(null);
                                }}
                                className="h-9 w-9 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Badge className={getRoleBadgeColor(u.role)}>{u.role}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === u.id && editField === "subscription_plan" ? (
                            <div className="flex gap-2">
                              <Select value={editValue} onValueChange={setEditValue}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="trial">Trial</SelectItem>
                                  <SelectItem value="starter">Starter</SelectItem>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                  <SelectItem value="mat">MAT</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateUser(u.id, "subscription_plan", editValue)}
                                className="h-9 w-9 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditField(null);
                                }}
                                className="h-9 w-9 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Badge className={getPlanBadgeColor(u.subscription_plan || u.licence_type)}>
                              {u.subscription_plan || u.licence_type || "N/A"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{u.school_name || "—"}</TableCell>
                        <TableCell>
                          {u.email_verified ? (
                            <Badge className="bg-green-100 text-green-700">Yes</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(u.id);
                                setEditField("role");
                                setEditValue(u.role);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(u.id);
                                setEditField("subscription_plan");
                                setEditValue(u.subscription_plan || u.licence_type || "trial");
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteUserId(u.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
