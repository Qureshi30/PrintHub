import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePricing, useAdminPricing, PricingConfig } from '@/hooks/usePricing';
import { 
  DollarSign, 
  FileText, 
  Calculator, 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Clock,
  User,
  TrendingUp
} from 'lucide-react';

const PricingSettings = () => {
  const { toast } = useToast();
  const { pricing, loading, error, refetch } = usePricing();
  const { updatePricing, resetToDefaults, updating, updateError } = useAdminPricing();

  // Form state
  const [formData, setFormData] = useState<PricingConfig>({
    baseRates: {
      blackAndWhite: 2.00,
      color: 5.00
    },
    paperSurcharges: {
      a4: 0,
      a3: 3.00,
      letter: 0.50,
      legal: 1.00,
      certificate: 5.00
    },
    discounts: {
      duplexPercentage: 10
    }
  });

  const [description, setDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load pricing data into form when available
  useEffect(() => {
    if (pricing && !loading) {
      setFormData({
        baseRates: { ...pricing.baseRates },
        paperSurcharges: { ...pricing.paperSurcharges },
        discounts: { ...pricing.discounts }
      });
      setHasChanges(false);
    }
  }, [pricing, loading]);

  // Handle input changes
  const handleInputChange = (section: keyof PricingConfig, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => {
      if (section === 'baseRates') {
        return {
          ...prev,
          baseRates: {
            ...prev.baseRates,
            [field]: numValue
          }
        };
      } else if (section === 'paperSurcharges') {
        return {
          ...prev,
          paperSurcharges: {
            ...prev.paperSurcharges,
            [field]: numValue
          }
        };
      } else if (section === 'discounts') {
        return {
          ...prev,
          discounts: {
            ...prev.discounts,
            [field]: numValue
          }
        };
      }
      return prev;
    });
    setHasChanges(true);
  };

  // Handle description change
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setHasChanges(true);
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];

    // Validate base rates
    if (formData.baseRates.blackAndWhite < 0 || formData.baseRates.blackAndWhite > 100) {
      errors.push('Black & White rate must be between ₹0 and ₹100');
    }
    if (formData.baseRates.color < 0 || formData.baseRates.color > 100) {
      errors.push('Color rate must be between ₹0 and ₹100');
    }

    // Validate paper surcharges
    Object.entries(formData.paperSurcharges).forEach(([key, value]) => {
      if (value < 0) {
        errors.push(`${key.toUpperCase()} surcharge cannot be negative`);
      }
    });

    // Validate duplex discount
    if (formData.discounts.duplexPercentage < 0 || formData.discounts.duplexPercentage > 100) {
      errors.push('Duplex discount must be between 0% and 100%');
    }

    return errors;
  };

  // Handle save
  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      await updatePricing({
        ...formData,
        description: description || 'Pricing updated via admin dashboard'
      });

      toast({
        title: 'Success',
        description: 'Pricing configuration updated successfully',
        variant: 'default',
      });

      setHasChanges(false);
      await refetch(); // Refresh pricing data
    } catch (err) {
      toast({
        title: 'Error',
        description: updateError || 'Failed to update pricing',
        variant: 'destructive',
      });
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all pricing to default values? This action cannot be undone.')) {
      try {
        await resetToDefaults();
        
        toast({
          title: 'Success',
          description: 'Pricing reset to default values successfully',
          variant: 'default',
        });

        setHasChanges(false);
        await refetch(); // Refresh pricing data
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to reset pricing to defaults',
          variant: 'destructive',
        });
      }
    }
  };

  // Calculate preview costs
  const calculatePreviewCost = (pageCount: number, isColor: boolean, paperSize: string, isDuplex: boolean) => {
    const baseRate = isColor ? formData.baseRates.color : formData.baseRates.blackAndWhite;
    const paperSurcharge = formData.paperSurcharges[paperSize.toLowerCase() as keyof typeof formData.paperSurcharges] || 0;
    let totalCost = (pageCount * baseRate) + paperSurcharge;
    
    if (isDuplex) {
      const discount = totalCost * (formData.discounts.duplexPercentage / 100);
      totalCost -= discount;
    }
    
    return totalCost.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading pricing configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 dark:text-gray-100">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-500" />
            Pricing Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure print pricing, paper surcharges, and discounts for the entire system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={updating}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updating}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {updateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Update Error</AlertTitle>
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>
            You have unsaved changes. Don't forget to save your pricing configuration.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Base Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Base Rates
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Set the base price per page for different print types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bw-rate">Black & White (₹/page)</Label>
              <Input
                id="bw-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.baseRates.blackAndWhite}
                onChange={(e) => handleInputChange('baseRates', 'blackAndWhite', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="color-rate">Color (₹/page)</Label>
              <Input
                id="color-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.baseRates.color}
                onChange={(e) => handleInputChange('baseRates', 'color', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Paper Surcharges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Paper Surcharges
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Additional charges for different paper sizes and types
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(formData.paperSurcharges).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={`surcharge-${key}`}>
                  {key.toUpperCase()} (₹)
                </Label>
                <Input
                  id={`surcharge-${key}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={value}
                  onChange={(e) => handleInputChange('paperSurcharges', key, e.target.value)}
                  className="mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Discounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              Discounts & Offers
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Configure discounts for special print options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="duplex-discount">Duplex Discount (%)</Label>
              <Input
                id="duplex-discount"
                type="number"
                step="1"
                min="0"
                max="100"
                value={formData.discounts.duplexPercentage}
                onChange={(e) => handleInputChange('discounts', 'duplexPercentage', e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Percentage discount for double-sided printing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-100">
            <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Price Preview
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Preview how changes affect actual print costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Standard B&W</h4>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ₹{calculatePreviewCost(1, false, 'a4', false)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 page B&W on A4</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Standard Color</h4>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ₹{calculatePreviewCost(1, true, 'a4', false)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 page Color on A4</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">B&W Duplex A3</h4>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ₹{calculatePreviewCost(1, false, 'a3', true)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">1 page B&W duplex on A3</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Bulk Color</h4>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ₹{calculatePreviewCost(10, true, 'a4', true)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">10 pages Color duplex on A4</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Configuration Info */}
      {pricing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Current Configuration
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Information about the active pricing configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Updated by:</span>
                <Badge variant="outline" className="dark:bg-gray-700 dark:text-gray-300">
                  {pricing.lastUpdatedBy ? `Admin ${pricing.lastUpdatedBy.substring(0, 8)}` : 'System'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Last updated:</span>
                <span className="text-sm font-medium dark:text-gray-300">
                  {pricing.lastUpdatedAt 
                    ? new Date(pricing.lastUpdatedAt).toLocaleString()
                    : 'Unknown'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Version:</span>
                <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">v{pricing.version || 1}</Badge>
              </div>
            </div>
            {pricing.description && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Last change:</strong> {pricing.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Update Description */}
      <Card>
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Change Description</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Add a description for this pricing update (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="e.g., Updated rates for new semester pricing"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingSettings;
