import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

// Define the pricing interface
export interface PricingConfig {
  _id?: string;
  baseRates: {
    blackAndWhite: number;
    color: number;
  };
  paperSurcharges: {
    a4: number;
    a3: number;
    letter: number;
    legal: number;
    certificate: number;
  };
  discounts: {
    duplexPercentage: number;
  };
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  isActive?: boolean;
  version?: number;
  description?: string;
}

// Default pricing values as fallback
const DEFAULT_PRICING: PricingConfig = {
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
  },
  isActive: true,
  version: 1
};

// Cache for pricing data to avoid redundant API calls
let pricingCache: {
  data: PricingConfig | null;
  timestamp: number;
  expiry: number;
} = {
  data: null,
  timestamp: 0,
  expiry: 5 * 60 * 1000 // 5 minutes cache
};

export const usePricing = () => {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  // Check if cached data is still valid
  const isCacheValid = () => {
    return pricingCache.data && 
           (Date.now() - pricingCache.timestamp) < pricingCache.expiry;
  };

  // Fetch pricing from API
  const fetchPricing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use cached data if available and valid
      if (isCacheValid() && pricingCache.data) {
        setPricing(pricingCache.data);
        setLoading(false);
        return pricingCache.data;
      }

      console.log('🔄 Fetching pricing configuration...');

      // Get the API base URL from environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${API_BASE_URL}/pricing/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const pricingData = result.data;
        
        // Update cache
        pricingCache = {
          data: pricingData,
          timestamp: Date.now(),
          expiry: 5 * 60 * 1000 // 5 minutes
        };

        setPricing(pricingData);
        console.log('✅ Pricing configuration loaded:', pricingData);
        
        setLoading(false);
        return pricingData;
      } else {
        throw new Error(result.message || 'Failed to load pricing');
      }
    } catch (err) {
      console.error('❌ Error fetching pricing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
      
      // Use default pricing on error
      setPricing(DEFAULT_PRICING);
      setLoading(false);
      return DEFAULT_PRICING;
    }
  }, [getToken]);

  // Force refresh pricing data (bypasses cache)
  const refetch = useCallback(async () => {
    // Clear cache to force fresh fetch
    pricingCache.data = null;
    pricingCache.timestamp = 0;
    
    return await fetchPricing();
  }, [fetchPricing]);

  // Calculate print cost using current pricing
  const calculateCost = useCallback((options: {
    pageCount: number;
    isColor?: boolean;
    paperSize?: string;
    isDuplex?: boolean;
  }) => {
    const {
      pageCount,
      isColor = false,
      paperSize = 'a4',
      isDuplex = false
    } = options;

    // Get base rate
    const baseRate = isColor ? pricing.baseRates.color : pricing.baseRates.blackAndWhite;
    
    // Calculate base cost
    let totalCost = pageCount * baseRate;
    
    // Add paper surcharge
    const normalizedPaperSize = paperSize.toLowerCase() as keyof typeof pricing.paperSurcharges;
    const paperSurcharge = pricing.paperSurcharges[normalizedPaperSize] || 0;
    totalCost += paperSurcharge;
    
    // Apply duplex discount
    if (isDuplex) {
      const duplexDiscount = totalCost * (pricing.discounts.duplexPercentage / 100);
      totalCost -= duplexDiscount;
    }
    
    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }, [pricing]);

  // Calculate cost breakdown
  const calculateCostBreakdown = useCallback((options: {
    pageCount: number;
    isColor?: boolean;
    paperSize?: string;
    isDuplex?: boolean;
  }) => {
    const {
      pageCount,
      isColor = false,
      paperSize = 'a4',
      isDuplex = false
    } = options;

    const baseRate = isColor ? pricing.baseRates.color : pricing.baseRates.blackAndWhite;
    const baseCost = pageCount * baseRate;
    
    const normalizedPaperSize = paperSize.toLowerCase() as keyof typeof pricing.paperSurcharges;
    const paperSurcharge = pricing.paperSurcharges[normalizedPaperSize] || 0;
    const paperCost = paperSurcharge;
    
    const subtotal = baseCost + paperCost;
    const duplexDiscountAmount = isDuplex ? (subtotal * (pricing.discounts.duplexPercentage / 100)) : 0;
    const totalCost = subtotal - duplexDiscountAmount;

    return {
      baseRate,
      baseCost: Math.round(baseCost * 100) / 100,
      paperSurcharge,
      paperCost: Math.round(paperCost * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      duplexDiscountPercentage: pricing.discounts.duplexPercentage,
      duplexDiscountAmount: Math.round(duplexDiscountAmount * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      breakdown: {
        pageCount,
        isColor,
        paperSize,
        isDuplex
      }
    };
  }, [pricing]);

  // Load pricing on mount
  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  return {
    pricing,
    loading,
    error,
    refetch,
    calculateCost,
    calculateCostBreakdown,
    // Utility functions
    isLoaded: !loading && !error,
    hasError: Boolean(error),
    // Helper to format currency
    formatCurrency: (amount: number) => `₹${amount.toFixed(2)}`
  };
};

// Hook for admin pricing management
export const useAdminPricing = () => {
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { getToken } = useAuth();

  // Update pricing configuration (admin only)
  const updatePricing = useCallback(async (newPricing: Partial<PricingConfig>) => {
    try {
      setUpdating(true);
      setUpdateError(null);

      console.log('🔄 Updating pricing configuration...', newPricing);

      // Get authentication token
      const token = await getToken();
      
      // Get the API base URL from environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_BASE_URL}/admin/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(newPricing),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, check if it's HTML (error page)
          const responseText = await response.text();
          if (responseText.includes('<!DOCTYPE')) {
            errorMessage = 'Server returned HTML instead of JSON. Check server logs for authentication issues.';
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Pricing configuration updated successfully');
        
        // Clear cache to force fresh fetch
        pricingCache.data = null;
        pricingCache.timestamp = 0;
        
        setUpdating(false);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update pricing');
      }
    } catch (err) {
      console.error('❌ Error updating pricing:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update pricing');
      setUpdating(false);
      throw err;
    }
  }, [getToken]);

  // Reset pricing to defaults
  const resetToDefaults = useCallback(async () => {
    try {
      setUpdating(true);
      setUpdateError(null);

      // Get authentication token
      const token = await getToken();
      
      // Get the API base URL from environment
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_BASE_URL}/admin/pricing/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If response is not JSON, check if it's HTML (error page)
          const responseText = await response.text();
          if (responseText.includes('<!DOCTYPE')) {
            errorMessage = 'Server returned HTML instead of JSON. Check server logs for authentication issues.';
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Pricing reset to defaults successfully');
        
        // Clear cache to force fresh fetch
        pricingCache.data = null;
        pricingCache.timestamp = 0;
        
        setUpdating(false);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to reset pricing');
      }
    } catch (err) {
      console.error('❌ Error resetting pricing:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to reset pricing');
      setUpdating(false);
      throw err;
    }
  }, [getToken]);

  return {
    updatePricing,
    resetToDefaults,
    updating,
    updateError,
    isUpdating: updating,
    hasUpdateError: Boolean(updateError)
  };
};

export default usePricing;