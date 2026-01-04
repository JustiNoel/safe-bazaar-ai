import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  name: string;
  price?: string;
  imageUrl?: string;
  description?: string;
}

interface ScanResult {
  product: Product;
  success: boolean;
  assessment?: {
    overall_score: number;
    verdict: string;
    risk_factors: Array<{ name: string; score: number; details: string }>;
    recommendations: string[];
  };
  error?: string;
}

const BulkScan: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { hasBulkScanning, isPremiumSeller } = usePremiumFeatures();
  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Redirect if not premium seller
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (!isPremiumSeller) {
      toast.error('Bulk scanning requires Premium Seller subscription');
      navigate('/premium');
    }
  }, [user, isPremiumSeller, navigate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('product'));
        const priceIndex = headers.findIndex(h => h.includes('price'));
        const descIndex = headers.findIndex(h => h.includes('desc'));
        const imageIndex = headers.findIndex(h => h.includes('image') || h.includes('url'));

        if (nameIndex === -1) {
          toast.error('CSV must have a "name" or "product" column');
          return;
        }

        const parsedProducts: Product[] = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.trim());
          return {
            name: cols[nameIndex] || '',
            price: priceIndex >= 0 ? cols[priceIndex] : undefined,
            description: descIndex >= 0 ? cols[descIndex] : undefined,
            imageUrl: imageIndex >= 0 ? cols[imageIndex] : undefined,
          };
        }).filter(p => p.name);

        if (parsedProducts.length > 50) {
          toast.warning('Maximum 50 products per batch. Only first 50 will be processed.');
          setProducts(parsedProducts.slice(0, 50));
        } else {
          setProducts(parsedProducts);
        }

        toast.success(`Loaded ${Math.min(parsedProducts.length, 50)} products`);
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkScan = async () => {
    if (products.length === 0) {
      toast.error('Please upload a CSV file first');
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-scan', {
        body: { products },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setResults(data.results);
      setProgress(100);
      toast.success(`Scanned ${data.summary.successful} of ${data.summary.total} products`);
    } catch (error: any) {
      toast.error(error.message || 'Bulk scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'SAFE': return 'bg-green-500';
      case 'CAUTION': return 'bg-yellow-500';
      case 'DANGER': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!hasBulkScanning) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bulk Product Scanning</h1>
            <p className="text-muted-foreground">
              Upload a CSV file to scan multiple products at once. Maximum 50 products per batch.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload Products
              </CardTitle>
              <CardDescription>
                CSV format: name (required), price, description, imageUrl
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Label htmlFor="csv-upload">Select CSV File</Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isScanning}
                />
              </div>

              {products.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {products.length} products ready to scan
                </div>
              )}

              <Button
                onClick={handleBulkScan}
                disabled={products.length === 0 || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Bulk Scan
                  </>
                )}
              </Button>

              {isScanning && (
                <Progress value={progress} className="w-full" />
              )}
            </CardContent>
          </Card>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
                <CardDescription>
                  {results.filter(r => r.success).length} successful, {results.filter(r => !r.success).length} failed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Verdict</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {result.product.name}
                        </TableCell>
                        <TableCell>
                          {result.success ? result.assessment?.overall_score : '-'}
                        </TableCell>
                        <TableCell>
                          {result.success && result.assessment && (
                            <Badge className={getVerdictColor(result.assessment.verdict)}>
                              {result.assessment.verdict}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-red-500" />
                              <span className="text-sm text-muted-foreground">
                                {result.error}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default BulkScan;
