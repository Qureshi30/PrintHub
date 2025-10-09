/**
 * Frontend Printer Service
 * Connects to backend API to fetch real printer data
 */

import apiClient from '@/lib/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface PrinterCapabilities {
  color: boolean;
  duplex: boolean;
  paperSizes: string[];
}

export interface PrinterPricing {
  baseCostPerPage: number;
  colorCostPerPage: number;
  currency: string;
}

export interface PrinterStation {
  _id: string;
  id: string;
  name: string;
  location: string;
  queueLength: number;
  estimatedWait: number;
  status: 'online' | 'offline' | 'maintenance' | 'busy';
  capabilities: PrinterCapabilities;
  pricing: PrinterPricing;
}

export interface APIProvidedPrinter {
  _id: string;
  id?: string;
  name: string;
  location: string;
  queueLength?: number;
  estimatedWait?: number;
  status: 'online' | 'offline' | 'maintenance' | 'busy';
  capabilities?: PrinterCapabilities;
  pricing: PrinterPricing;
  queue?: string[];
  isActive?: boolean;
}

export type PrinterStatus = 'online' | 'offline' | 'maintenance' | 'busy';

export interface AddPrinterData {
  name: string;
  location: string;
  status: PrinterStatus;
  connection?: string;
  type?: string;
  ipAddress?: string;
  model?: string;
}

class PrinterService {
  
  /**
   * Fetch available printers from backend
   */
  async getAvailablePrinters(): Promise<PrinterStation[]> {
    try {
      // Use apiClient to get ngrok headers automatically
      const response = await apiClient.get('/printers/test');
      const result = response.data;
      
      if (result.success && result.data) {
        return result.data.map((printer: APIProvidedPrinter) => ({
          ...printer,
          id: printer._id || printer.id, // Ensure id field exists
          capabilities: printer.capabilities || {
            color: printer.name?.toLowerCase().includes('color') || printer.name?.toLowerCase().includes('pixma') || false,
            duplex: !printer.name?.toLowerCase().includes('pdf'),
            paperSizes: ['A4', 'Letter']
          }
        }));
      } else {
        console.error('Failed to fetch printers from backend:', result.message);
        return this.getFallbackPrinters();
      }
    } catch (error) {
      console.error('Error fetching printers from backend:', error);
      return this.getFallbackPrinters();
    }
  }

  /**
   * Get specific printer details including queue
   */
  async getPrinterDetails(printerId: string) {
    try {
      const response = await apiClient.get(`/printers/${printerId}`);
      const result = response.data;
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching printer details:', error);
      return null;
    }
  }

  /**
   * Get printer queue status
   */
  async getPrinterQueue(printerId: string) {
    try {
      const response = await apiClient.get(`/printers/${printerId}/queue`);
      const result = response.data;
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching printer queue:', error);
      return null;
    }
  }

  /**
   * Calculate print cost based on printer pricing
   */
  calculatePrintCost(printer: PrinterStation, pages: number, copies: number, isColor: boolean): number {
    const baseCost = printer.pricing.baseCostPerPage * pages * copies;
    const colorCost = isColor ? (printer.pricing.colorCostPerPage * pages * copies) : 0;
    return baseCost + colorCost;
  }

  /**
   * Format currency based on printer's currency setting
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    if (currency === 'INR') {
      return `₹${amount.toFixed(2)}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * Fallback printers if backend is unavailable
   */
  private getFallbackPrinters(): PrinterStation[] {
    return [
      {
        _id: 'fallback-hp-laserjet',
        id: 'fallback-hp-laserjet',
        name: 'HP LaserJet Pro M201-M202',
        location: 'Main Library - Ground Floor',
        queueLength: 2,
        estimatedWait: 6,
        status: 'online',
        capabilities: {
          color: false,
          duplex: true,
          paperSizes: ['A4', 'Letter', 'Legal']
        },
        pricing: {
          baseCostPerPage: 1.00,
          colorCostPerPage: 0,
          currency: 'INR'
        }
      },
      {
        _id: 'fallback-pdf',
        id: 'fallback-pdf',
        name: 'Microsoft Print to PDF',
        location: 'Digital Download - Instant Access',
        queueLength: 0,
        estimatedWait: 0,
        status: 'online',
        capabilities: {
          color: true,
          duplex: false,
          paperSizes: ['A4', 'Letter', 'A3', 'Legal']
        },
        pricing: {
          baseCostPerPage: 0.50,
          colorCostPerPage: 0,
          currency: 'INR'
        }
      }
    ];
  }

  /**
   * Map printer name to consistent IDs for backend compatibility
   */
  mapPrinterNameToId(printerName: string): string {
    const nameMap: { [key: string]: string } = {
      'HP LaserJet Pro M201-M202': 'hp-laserjet-m201',
      'Microsoft Print to PDF': 'microsoft-pdf',
      'HP LaserJet Pro M201 (Backup)': 'hp-laserjet-backup',
      'HP LaserJet Pro M202 (Admin)': 'hp-laserjet-admin'
    };
    
    return nameMap[printerName] || printerName.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Add a new printer to the system
   */
  async addPrinter(printerData: AddPrinterData, token: string | null): Promise<void> {
    try {
      await apiClient.post('/printers', printerData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
    } catch (error) {
      console.error('Error adding printer:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to add printer';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update printer location
   */
  async updatePrinterLocation(printerId: string, location: string, token: string | null): Promise<void> {
    try {
      await apiClient.put(`/printers/${printerId}/location`, { location }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
    } catch (error) {
      console.error('Error updating printer location:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update printer location';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update printer status
   */
  async updatePrinterStatus(printerId: string, status: PrinterStatus, token: string | null): Promise<void> {
    try {
      await apiClient.put(`/printers/${printerId}/status`, { status }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
    } catch (error) {
      console.error('Error updating printer status:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update printer status';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a printer from the system
   */
  async deletePrinter(printerId: string, token: string | null): Promise<void> {
    try {
      await apiClient.delete(`/printers/${printerId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
    } catch (error) {
      console.error('Error deleting printer:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete printer';
      throw new Error(errorMessage);
    }
  }
}

export const printerService = new PrinterService();
export default printerService;