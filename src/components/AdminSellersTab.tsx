import { useState, useEffect } from "react";
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertTriangle,
  Search,
  MoreHorizontal,
  Shield,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SellerRecord {
  id: string;
  user_id: string;
  role: string;
  seller_product_name: string | null;
  seller_product_image: string | null;
  seller_product_price: number | null;
  seller_location: string | null;
  seller_national_id: string | null;
  seller_email: string | null;
  seller_verified: boolean | null;
  phone: string | null;
  premium: boolean;
  created_at: string;
}

const AdminSellersTab = () => {
  const { user } = useAuth();
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<SellerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [trustScoreDialogOpen, setTrustScoreDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerRecord | null>(null);
  const [newTrustScore, setNewTrustScore] = useState([70]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSellers(sellers);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = sellers.filter(s => 
      s.seller_product_name?.toLowerCase().includes(query) ||
      s.seller_location?.toLowerCase().includes(query) ||
      s.phone?.toLowerCase().includes(query) ||
      s.seller_email?.toLowerCase().includes(query)
    );
    setFilteredSellers(filtered);
  }, [searchQuery, sellers]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "seller")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSellers(data || []);
      setFilteredSellers(data || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySeller = async (seller: SellerRecord, verified: boolean) => {
    if (!user) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ seller_verified: verified })
        .eq("user_id", seller.user_id);

      if (error) throw error;

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: verified ? "verify_seller" : "unverify_seller",
        target_user_id: seller.user_id,
        details: { seller_name: seller.seller_product_name },
      });

      toast.success(verified ? "Seller verified successfully" : "Seller verification revoked");
      fetchSellers();
    } catch (error) {
      console.error("Error updating seller:", error);
      toast.error("Failed to update seller status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTrustScore = async () => {
    if (!selectedSeller || !user) return;
    
    setActionLoading(true);
    try {
      // Store trust score update in admin_actions since we don't have a dedicated field
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "update_trust_score",
        target_user_id: selectedSeller.user_id,
        details: { 
          new_score: newTrustScore[0],
          seller_name: selectedSeller.seller_product_name 
        },
      });

      toast.success(`Trust score updated to ${newTrustScore[0]}`);
      setTrustScoreDialogOpen(false);
      fetchSellers();
    } catch (error) {
      console.error("Error updating trust score:", error);
      toast.error("Failed to update trust score");
    } finally {
      setActionLoading(false);
    }
  };

  const getTrustScoreBadge = (verified: boolean | null) => {
    if (verified) {
      return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>;
    }
    return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Seller Management ({sellers.length})
              </CardTitle>
              <CardDescription>
                View, verify, and manage seller profiles and trust scores
              </CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, location, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {seller.seller_product_image ? (
                          <img 
                            src={seller.seller_product_image} 
                            alt="Product" 
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Store className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{seller.seller_product_name || "No product"}</p>
                          {seller.premium && (
                            <Badge variant="outline" className="text-xs">Premium</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {seller.seller_product_price ? (
                        <span className="font-medium">KES {seller.seller_product_price.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {seller.seller_location || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {seller.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {seller.phone}
                          </span>
                        )}
                        {seller.seller_email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {seller.seller_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTrustScoreBadge(seller.seller_verified)}
                    </TableCell>
                    <TableCell>
                      {new Date(seller.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSeller(seller);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSeller(seller);
                              setNewTrustScore([70]);
                              setTrustScoreDialogOpen(true);
                            }}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Set Trust Score
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {seller.seller_verified ? (
                            <DropdownMenuItem
                              onClick={() => handleVerifySeller(seller, false)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Revoke Verification
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleVerifySeller(seller, true)}
                              className="text-success"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verify Seller
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredSellers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "No sellers match your search" : "No sellers found"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* View Seller Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Seller Details
            </DialogTitle>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-4 py-4">
              {selectedSeller.seller_product_image && (
                <div className="w-full h-48 rounded-lg overflow-hidden">
                  <img 
                    src={selectedSeller.seller_product_image} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedSeller.seller_product_name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="font-medium">
                    {selectedSeller.seller_product_price 
                      ? `KES ${selectedSeller.seller_product_price.toLocaleString()}` 
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedSeller.seller_location || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedSeller.phone || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedSeller.seller_email || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">National ID</Label>
                  <p className="font-medium flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {selectedSeller.seller_national_id || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Label className="text-muted-foreground">Verification Status:</Label>
                {getTrustScoreBadge(selectedSeller.seller_verified)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trust Score Dialog */}
      <Dialog open={trustScoreDialogOpen} onOpenChange={setTrustScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Set Trust Score
            </DialogTitle>
            <DialogDescription>
              Manually adjust this seller's trust score based on your assessment.
            </DialogDescription>
          </DialogHeader>
          {selectedSeller && (
            <div className="space-y-6 py-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{selectedSeller.seller_product_name || "Unknown Seller"}</p>
                <p className="text-muted-foreground">{selectedSeller.seller_location}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Trust Score</Label>
                  <span className={`text-2xl font-bold ${
                    newTrustScore[0] >= 80 ? 'text-success' :
                    newTrustScore[0] >= 60 ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {newTrustScore[0]}
                  </span>
                </div>
                <Slider
                  value={newTrustScore}
                  onValueChange={setNewTrustScore}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Low Trust
                  </span>
                  <span className="flex items-center gap-1">
                    High Trust <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrustScoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTrustScore} disabled={actionLoading}>
              {actionLoading ? "Updating..." : "Update Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSellersTab;
