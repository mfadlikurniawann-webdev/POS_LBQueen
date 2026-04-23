// Types for Web Bluetooth API
interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
}
interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<any[]>;
  connected: boolean;
}
interface BluetoothRemoteGATTCharacteristic {
  writeValue(value: BufferSource): Promise<void>;
  properties: any;
}
interface Navigator {
  bluetooth: {
    requestDevice(options?: any): Promise<BluetoothDevice>;
  };
}
declare const navigator: Navigator;

export class ESCPOSPrinter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  async connect() {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });

      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) throw new Error("Gagal terhubung ke GATT server");

      const services = await this.server.getPrimaryServices();
      if (!services.length) throw new Error("Tidak ditemukan service Bluetooth");

      let foundCharacteristic = null;
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            foundCharacteristic = char;
            break;
          }
        }
        if (foundCharacteristic) break;
      }

      if (!foundCharacteristic) throw new Error("Karakteristik write tidak ditemukan pada printer");
      this.characteristic = foundCharacteristic;
      
      return true;
    } catch (error) {
      console.error("Printer connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
  }

  isConnected() {
    return !!this.characteristic;
  }

  async printReceipt(
    invoiceNumber: string,
    customerName: string,
    items: any[],
    subtotal: number,
    discount: number,
    total: number,
    payment: number,
    change: number
  ) {
    if (!this.isConnected()) throw new Error("Printer belum terhubung");

    const encoder = new TextEncoder();
    const commands: Uint8Array[] = [];

    const init = () => commands.push(new Uint8Array([0x1B, 0x40])); // Initialize
    const alignCenter = () => commands.push(new Uint8Array([0x1B, 0x61, 0x01]));
    const alignLeft = () => commands.push(new Uint8Array([0x1B, 0x61, 0x00]));
    const alignRight = () => commands.push(new Uint8Array([0x1B, 0x61, 0x02]));
    const boldOn = () => commands.push(new Uint8Array([0x1B, 0x45, 0x01]));
    const boldOff = () => commands.push(new Uint8Array([0x1B, 0x45, 0x00]));
    const feed = (lines = 1) => commands.push(new Uint8Array([0x1B, 0x64, lines]));
    const writeText = (text: string) => commands.push(encoder.encode(text));
    const writeLine = (text: string) => writeText(text + "\n");
    const divider = () => writeLine("--------------------------------"); // 32 chars width

    // Format utility
    const formatRp = (num: number) => num.toLocaleString("id-ID");
    const padRight = (str: string, len: number) => (str + " ".repeat(len)).substring(0, len);
    const padLeft = (str: string, len: number) => (" ".repeat(len) + str).slice(-len);

    init();
    alignCenter();
    boldOn();
    writeLine("LBQueen Care Beauty");
    boldOff();
    writeLine("Terminal Kasir");
    divider();
    alignLeft();
    writeLine(`No   : ${invoiceNumber}`);
    writeLine(`Tgl  : ${new Date().toLocaleString('id-ID')}`);
    writeLine(`Pel  : ${customerName || 'Guest'}`);
    divider();

    items.forEach(item => {
      // Line 1: Item Name
      writeLine(`${item.name} ${item.variant_name ? '(' + item.variant_name + ')' : ''}`);
      // Line 2: Qty x Price = Subtotal
      const qtyStr = `${item.qty}x`;
      const priceStr = formatRp(item.selling_price);
      const totalStr = formatRp(item.selling_price * item.qty);
      
      // Calculate spacing
      const leftPart = `${qtyStr} ${priceStr}`;
      const spaces = Math.max(1, 32 - leftPart.length - totalStr.length);
      writeLine(`${leftPart}${" ".repeat(spaces)}${totalStr}`);
    });

    divider();
    
    // Summary
    const printRow = (label: string, value: string) => {
      const spaces = Math.max(1, 32 - label.length - value.length);
      writeLine(`${label}${" ".repeat(spaces)}${value}`);
    };

    printRow("Subtotal", formatRp(subtotal));
    if (discount > 0) {
      printRow("Diskon", `-${formatRp(discount)}`);
    }
    
    boldOn();
    printRow("TOTAL", formatRp(total));
    boldOff();
    
    printRow("Bayar", formatRp(payment));
    printRow("Kembali", formatRp(change));

    divider();
    alignCenter();
    writeLine("Terima kasih atas kunjungannya!");
    feed(3);

    // Send chunks to printer
    for (const chunk of commands) {
      // Split into 512 byte chunks max to prevent GATT errors
      for (let i = 0; i < chunk.length; i += 512) {
        await this.characteristic?.writeValue(chunk.slice(i, i + 512));
      }
    }
  }
}

export const bluetoothPrinter = new ESCPOSPrinter();
