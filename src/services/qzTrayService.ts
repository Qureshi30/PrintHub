import qz from 'qz-tray';

export interface DetectedPrinter {
  name: string;
  connection?: string;
  type?: string;
  isOnline?: boolean;
}

class QZTrayService {
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }
      this.isConnected = true;
      console.log('QZ Tray connected successfully');
    } catch (error) {
      console.error('Failed to connect to QZ Tray:', error);
      throw new Error('QZ Tray connection failed. Please ensure QZ Tray is running.');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (qz.websocket.isActive()) {
        await qz.websocket.disconnect();
      }
      this.isConnected = false;
      console.log('QZ Tray disconnected');
    } catch (error) {
      console.error('Failed to disconnect from QZ Tray:', error);
    }
  }

  async listPrinters(): Promise<DetectedPrinter[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const printers = await qz.printers.find();
      const printersWithStatus = await Promise.all(
        printers.map(async (printer: string) => {
          const isOnline = await this.checkPrinterStatus(printer);
          return {
            name: printer,
            connection: 'local',
            type: 'unknown',
            isOnline
          };
        })
      );
      
      return printersWithStatus;
    } catch (error) {
      console.error('Failed to list printers:', error);
      throw new Error('Failed to detect printers. Please check QZ Tray connection.');
    }
  }

  async checkPrinterStatus(printerName: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Try to get printer details - if successful, printer is likely online
      const printer = await qz.printers.find(printerName);
      return printer && printer.length > 0;
    } catch (error) {
      console.warn(`Failed to check status for printer ${printerName}:`, error);
      return false;
    }
  }

  async findPrinter(name: string): Promise<DetectedPrinter | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const printer = await qz.printers.find(name);
      if (printer && printer.length > 0) {
        return {
          name: printer[0],
          connection: 'local',
          type: 'unknown'
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to find printer:', error);
      return null;
    }
  }

  async getDefaultPrinter(): Promise<DetectedPrinter | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const defaultPrinter = await qz.printers.getDefault();
      if (defaultPrinter) {
        return {
          name: defaultPrinter,
          connection: 'local',
          type: 'default'
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get default printer:', error);
      return null;
    }
  }

  isQZTrayConnected(): boolean {
    return this.isConnected && qz.websocket.isActive();
  }

  /**
   * Initialize QZ Tray service and detect available printers
   */
  async initialize(): Promise<DetectedPrinter[]> {
    try {
      await this.connect();
      return await this.listPrinters();
    } catch (error) {
      console.error('Failed to initialize QZ Tray service:', error);
      return [];
    }
  }

  /**
   * Check if QZ Tray application is available and running
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return this.isQZTrayConnected();
    } catch (error) {
      console.warn('QZ Tray is not available:', error);
      return false;
    }
  }
}

export const qzTrayService = new QZTrayService();
