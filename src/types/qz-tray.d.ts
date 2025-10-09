declare module 'qz-tray' {
  interface QZWebSocket {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isActive(): boolean;
  }

  interface QZPrinters {
    find(name?: string): Promise<string[]>;
    getDefault(): Promise<string>;
  }

  interface QZTray {
    websocket: QZWebSocket;
    printers: QZPrinters;
  }

  const qz: QZTray;
  export default qz;
}