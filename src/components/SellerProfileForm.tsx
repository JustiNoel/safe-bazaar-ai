import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Save, User, MapPin, Phone, Mail, CreditCard, Package } from "lucide-react";

interface SellerProfile {
  seller_product_image: string | null;
  seller_product_name: string | null;
  seller_product_price: number | null;
  seller_location: string | null;
  seller_national_id: string | null;
  seller_email: string | null;
  phone: string | null;
}

const SellerProfileForm = () => {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<SellerProfile>({
    seller_product_image: null,
    seller_product_name: null,
    seller_product_price: null,
    seller_location: null,
    seller_national_id: null,
    seller_email: null,
    phone: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("seller_product_image, seller_product_name, seller_product_price, seller_location, seller_national_id, seller_email, phone")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            seller_product_image: data.seller_product_image,
            seller_product_name: data.seller_product_name,
            seller_product_price: data.seller_product_price,
            seller_location: data.seller_location,
            seller_national_id: data.seller_national_id,
            seller_email: data.seller_email || user.email,
            phone: data.phone,
          });
          if (data.seller_product_image) {
            setImagePreview(data.seller_product_image);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, seller_product_image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("Please log in to update your profile");
      return;
    }

    // Validation
    if (!formData.seller_product_name?.trim()) {
      toast.error("Please enter what you're selling");
      return;
    }
    if (!formData.seller_location?.trim()) {
      toast.error("Please enter your location");
      return;
    }
    if (!formData.phone?.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          seller_product_image: formData.seller_product_image,
          seller_product_name: formData.seller_product_name,
          seller_product_price: formData.seller_product_price,
          seller_location: formData.seller_location,
          seller_national_id: formData.seller_national_id,
          seller_email: formData.seller_email,
          phone: formData.phone,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Seller profile updated successfully!");
      await refreshProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Seller Profile
        </CardTitle>
        <CardDescription>
          Complete your seller profile to build trust with buyers. This information helps verify your identity and products.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Image */}
          <div className="space-y-2">
            <Label htmlFor="product-image" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Image
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg overflow-hidden flex items-center justify-center bg-muted/50">
                {imagePreview ? (
                  <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="product-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="product-image" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product-name" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              What are you selling? *
            </Label>
            <Input
              id="product-name"
              placeholder="e.g., Electronics, Clothing, Food items..."
              value={formData.seller_product_name || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seller_product_name: e.target.value }))}
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="product-price">Price Range (KES)</Label>
            <Input
              id="product-price"
              type="number"
              placeholder="Average price of your products"
              value={formData.seller_product_price || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seller_product_price: parseFloat(e.target.value) || null }))}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              placeholder="e.g., Nairobi, Westlands"
              value={formData.seller_location || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seller_location: e.target.value }))}
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+254 7XX XXX XXX"
              value={formData.phone || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.seller_email || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seller_email: e.target.value }))}
            />
          </div>

          {/* National ID */}
          <div className="space-y-2">
            <Label htmlFor="national-id" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              National ID Number
            </Label>
            <Input
              id="national-id"
              placeholder="For verification purposes"
              value={formData.seller_national_id || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, seller_national_id: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Your ID is encrypted and used only for verification. It helps build buyer trust.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SellerProfileForm;
