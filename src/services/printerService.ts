/**
 * Frontend Printer Service
 * Connects to backend API to fetch real printer data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      // Use test endpoint for now (no auth required)
      const response = await fetch(`${API_BASE_URL}/api/printers/test`, {
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
      const response = await fetch(`${API_BASE_URL}/api/printers/${printerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/api/printers/${printerId}/queue`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/api/printers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(printerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add printer');
      }
    } catch (error) {
      console.error('Error adding printer:', error);
      throw error;
    }
  }

  /**
   * Update printer location
   */
  async updatePrinterLocation(printerId: string, location: string, token: string | null): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/printers/${printerId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ location })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update printer location');
      }
    } catch (error) {
      console.error('Error updating printer location:', error);
      throw error;
    }
  }

  /**
   * Update printer status
   */
  async updatePrinterStatus(printerId: string, status: PrinterStatus, token: string | null): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/printers/${printerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update printer status');
      }
    } catch (error) {
      console.error('Error updating printer status:', error);
      throw error;
    }
  }

  /**
   * Delete a printer from the system
   */
  async deletePrinter(printerId: string, token: string | null): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/printers/${printerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete printer');
      }
    } catch (error) {
      console.error('Error deleting printer:', error);
      throw error;
    }
  }
}

export const printerService = new PrinterService();
export default printerService;