/**
 * SNMP Printer Discovery Service
 * 
 * Automatically discovers printers on the local network using SNMP.
 * Scans common IP ranges and attempts to identify SNMP-enabled printers.
 */

const snmp = require('net-snmp');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// SNMP OIDs for printer identification
const OIDS = {
  sysDescr: '1.3.6.1.2.1.1.1.0',        // System Description
  sysObjectID: '1.3.6.1.2.1.1.2.0',     // System Object ID
  sysName: '1.3.6.1.2.1.1.5.0',         // System Name
  hrDeviceDescr: '1.3.6.1.2.1.25.3.2.1.3.1', // Device Description
  prtGeneralPrinterName: '1.3.6.1.2.1.43.5.1.1.16.1', // Printer Name (RFC 1759)
  prtMarkerSuppliesDescription: '1.3.6.1.2.1.43.11.1.1.6.1.1', // Supply Description
};

/**
 * Get local network IP ranges to scan
 */
function getLocalNetworkRanges() {
  const interfaces = os.networkInterfaces();
  const ranges = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Only IPv4, non-internal interfaces
      if (iface.family === 'IPv4' && !iface.internal) {
        const ipParts = iface.address.split('.');
        const subnet = iface.netmask;
        
        // For simplicity, scan common ranges
        if (subnet === '255.255.255.0') {
          // Class C network - scan all 254 hosts
          const baseIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
          ranges.push({
            baseIP,
            start: 1,
            end: 254,
            networkInterface: name,
          });
        } else if (subnet === '255.255.0.0') {
          // Class B - scan current subnet only
          const baseIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
          ranges.push({
            baseIP,
            start: 1,
            end: 254,
            networkInterface: name,
          });
        }
      }
    }
  }

  return ranges;
}

/**
 * Check if an IP responds to SNMP queries
 */
function checkSNMPDevice(ipAddress, timeout = 2000) {
  return new Promise((resolve) => {
    const session = snmp.createSession(ipAddress, 'public', {
      timeout,
      retries: 1,
      version: snmp.Version2c,
    });

    const oids = [OIDS.sysDescr, OIDS.sysName, OIDS.sysObjectID];

    session.get(oids, (error, varbinds) => {
      session.close();

      if (error) {
        resolve(null);
        return;
      }

      const deviceInfo = {
        ipAddress,
        sysDescr: null,
        sysName: null,
        sysObjectID: null,
        isPrinter: false,
      };

      varbinds.forEach((varbind) => {
        if (snmp.isVarbindError(varbind)) {
          return;
        }

        const value = varbind.value.toString();
        
        if (varbind.oid === OIDS.sysDescr) {
          deviceInfo.sysDescr = value;
        } else if (varbind.oid === OIDS.sysName) {
          deviceInfo.sysName = value;
        } else if (varbind.oid === OIDS.sysObjectID) {
          deviceInfo.sysObjectID = value;
        }
      });

      // Check if this looks like a printer
      const printerKeywords = ['printer', 'laserjet', 'inkjet', 'deskjet', 'officejet', 
                               'photosmart', 'pagewide', 'color laser', 'mfp', 'multifunction'];
      
      const description = (deviceInfo.sysDescr || '').toLowerCase();
      const name = (deviceInfo.sysName || '').toLowerCase();
      
      deviceInfo.isPrinter = printerKeywords.some(keyword => 
        description.includes(keyword) || name.includes(keyword)
      );

      resolve(deviceInfo);
    });
  });
}

/**
 * Get detailed printer information via SNMP
 */
function getPrinterDetails(ipAddress, timeout = 3000) {
  return new Promise((resolve) => {
    const session = snmp.createSession(ipAddress, 'public', {
      timeout,
      retries: 1,
      version: snmp.Version2c,
    });

    const oids = [
      OIDS.sysDescr,
      OIDS.sysName,
      OIDS.hrDeviceDescr,
      OIDS.prtGeneralPrinterName,
    ];

    session.get(oids, (error, varbinds) => {
      session.close();

      if (error) {
        resolve({
          ipAddress,
          name: null,
          model: null,
          description: null,
        });
        return;
      }

      const details = {
        ipAddress,
        name: null,
        model: null,
        description: null,
      };

      varbinds.forEach((varbind) => {
        if (snmp.isVarbindError(varbind)) {
          return;
        }

        const value = varbind.value.toString();

        if (varbind.oid === OIDS.sysName || varbind.oid === OIDS.prtGeneralPrinterName) {
          details.name = value;
        } else if (varbind.oid === OIDS.hrDeviceDescr) {
          details.model = value;
        } else if (varbind.oid === OIDS.sysDescr) {
          details.description = value;
        }
      });

      // Fallback: use description as name if name is not set
      if (!details.name && details.description) {
        details.name = details.description.split('\n')[0].substring(0, 50);
      }

      // Extract model from description if not found
      if (!details.model && details.description) {
        const modelMatch = details.description.match(/(HP|Canon|Epson|Brother|Xerox|Ricoh|Kyocera|Samsung|Lexmark)\s+[\w\s\-]+/i);
        if (modelMatch) {
          details.model = modelMatch[0];
        }
      }

      resolve(details);
    });
  });
}

/**
 * Try to get MAC address using ARP (Windows)
 */
async function getMACAddress(ipAddress) {
  try {
    const { stdout } = await execAsync(`arp -a ${ipAddress}`);
    const macMatch = stdout.match(/([0-9a-f]{2}[:-]){5}([0-9a-f]{2})/i);
    return macMatch ? macMatch[0].replace(/-/g, ':').toUpperCase() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Scan a single IP address
 */
async function scanIP(ipAddress, options = {}) {
  const { timeout = 2000, includeMAC = true } = options;

  try {
    console.log(`🔍 Scanning ${ipAddress}...`);
    
    const deviceInfo = await checkSNMPDevice(ipAddress, timeout);
    
    if (!deviceInfo) {
      return null;
    }

    if (!deviceInfo.isPrinter) {
      console.log(`   ℹ️  Found device but not a printer: ${deviceInfo.sysName || 'Unknown'}`);
      return null;
    }

    console.log(`   ✅ Found printer at ${ipAddress}`);
    
    // Get detailed printer info
    const details = await getPrinterDetails(ipAddress);
    
    // Try to get MAC address
    let macAddress = null;
    if (includeMAC) {
      macAddress = await getMACAddress(ipAddress);
    }

    return {
      ipAddress,
      name: details.name || deviceInfo.sysName || `Printer-${ipAddress}`,
      model: details.model || 'Unknown Model',
      description: details.description || deviceInfo.sysDescr,
      macAddress,
      snmpEnabled: true,
      discoveredAt: new Date(),
    };
  } catch (error) {
    console.error(`   ❌ Error scanning ${ipAddress}:`, error.message);
    return null;
  }
}

/**
 * Scan a range of IP addresses
 */
async function scanIPRange(baseIP, start, end, options = {}) {
  const { 
    timeout = 2000, 
    includeMAC = true,
    concurrency = 10, // Scan 10 IPs at a time
  } = options;

  console.log(`\n🔍 Scanning IP range: ${baseIP}.${start} - ${baseIP}.${end}`);
  console.log(`⏱️  Timeout: ${timeout}ms, Concurrency: ${concurrency}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const discoveredPrinters = [];
  const ipAddresses = [];

  // Generate list of IPs to scan
  for (let i = start; i <= end; i++) {
    ipAddresses.push(`${baseIP}.${i}`);
  }

  // Scan in batches for better performance
  for (let i = 0; i < ipAddresses.length; i += concurrency) {
    const batch = ipAddresses.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(ip => scanIP(ip, { timeout, includeMAC }))
    );

    results.forEach(result => {
      if (result) {
        discoveredPrinters.push(result);
      }
    });
  }

  return discoveredPrinters;
}

/**
 * Discover all printers on local network
 */
async function discoverPrinters(options = {}) {
  const { 
    timeout = 2000,
    includeMAC = true,
    concurrency = 10,
    specificRange = null, // { baseIP, start, end }
  } = options;

  console.log('\n🖨️  Starting Automated Printer Discovery');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let allDiscoveredPrinters = [];

  if (specificRange) {
    // Scan specific range
    const printers = await scanIPRange(
      specificRange.baseIP,
      specificRange.start,
      specificRange.end,
      { timeout, includeMAC, concurrency }
    );
    allDiscoveredPrinters = printers;
  } else {
    // Scan all local network ranges
    const ranges = getLocalNetworkRanges();
    
    if (ranges.length === 0) {
      console.log('❌ No local network interfaces found');
      return [];
    }

    console.log(`📡 Found ${ranges.length} network interface(s) to scan:`);
    ranges.forEach(range => {
      console.log(`   - ${range.baseIP}.0/24 (${range.networkInterface})`);
    });

    for (const range of ranges) {
      const printers = await scanIPRange(
        range.baseIP,
        range.start,
        range.end,
        { timeout, includeMAC, concurrency }
      );
      allDiscoveredPrinters.push(...printers);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Discovery complete! Found ${allDiscoveredPrinters.length} printer(s)\n`);

  return allDiscoveredPrinters;
}

module.exports = {
  discoverPrinters,
  scanIPRange,
  scanIP,
  getPrinterDetails,
  getMACAddress,
  getLocalNetworkRanges,
};
