/**
 * Automated Printer Discovery Tool
 * 
 * Discovers printers on the network and optionally adds them to the database.
 * Can also be used for one-time scans or scheduled discovery.
 * 
 * Usage:
 *   node discover-printers.js                    # Auto-discover on all networks
 *   node discover-printers.js --range 192.168.1  # Scan specific network
 *   node discover-printers.js --add-to-db        # Auto-add discovered printers to database
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const { discoverPrinters } = require('./src/services/snmpDiscovery');
const Printer = require('./src/models/Printer');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const addToDB = args.includes('--add-to-db');
  const rangeArg = args.find(arg => arg.startsWith('--range='));
  const specificRange = rangeArg ? rangeArg.split('=')[1] : null;

  try {
    console.log('\n🖨️  Automated SNMP Printer Discovery');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Prepare discovery options
    const discoveryOptions = {
      timeout: 2000,
      includeMAC: true,
      concurrency: 10,
    };

    if (specificRange) {
      console.log(`🎯 Scanning specific range: ${specificRange}.0/24\n`);
      discoveryOptions.specificRange = {
        baseIP: specificRange,
        start: 1,
        end: 254,
      };
    }

    // Start discovery
    const discoveredPrinters = await discoverPrinters(discoveryOptions);

    if (discoveredPrinters.length === 0) {
      console.log('\n❌ No printers discovered on the network.');
      console.log('\nPossible reasons:');
      console.log('  - No SNMP-enabled printers on the network');
      console.log('  - Printers have SNMP disabled');
      console.log('  - Firewall blocking SNMP (UDP port 161)');
      console.log('  - Wrong network range\n');
      process.exit(0);
    }

    // Display discovered printers
    console.log('\n📋 Discovered Printers:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    discoveredPrinters.forEach((printer, index) => {
      console.log(`${index + 1}. ${printer.name}`);
      console.log(`   IP Address: ${printer.ipAddress}`);
      console.log(`   Model: ${printer.model}`);
      if (printer.macAddress) {
        console.log(`   MAC Address: ${printer.macAddress}`);
      }
      console.log('');
    });

    // Ask if user wants to add to database
    if (!addToDB) {
      const addAnswer = await question('Do you want to add these printers to the database? (yes/no) [yes]: ');
      if (addAnswer.toLowerCase() === 'no' || addAnswer.toLowerCase() === 'n') {
        console.log('\n✅ Discovery complete. No printers were added to the database.\n');
        process.exit(0);
      }
    }

    // Connect to database
    console.log('\n📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected to MongoDB\n');

    // Check for existing printers
    const existingPrinters = await Printer.find({});
    const existingIPs = new Set(existingPrinters.map(p => p.systemInfo?.ipAddress).filter(Boolean));

    let addedCount = 0;
    let skippedCount = 0;

    for (const discovered of discoveredPrinters) {
      // Skip if already exists
      if (existingIPs.has(discovered.ipAddress)) {
        console.log(`⏭️  Skipping ${discovered.name} - already exists in database`);
        skippedCount++;
        continue;
      }

      // Ask for location
      console.log(`\nAdding printer: ${discovered.name} (${discovered.ipAddress})`);
      const location = await question('Enter location (e.g., "Library Floor 1") [Auto-discovered]: ');
      const finalLocation = location.trim() || 'Auto-discovered';

      // Create printer document
      const newPrinter = new Printer({
        name: discovered.name,
        model: discovered.model,
        location: finalLocation,
        status: 'online',
        connectionType: 'Network',
        systemInfo: {
          ipAddress: discovered.ipAddress,
          connectionType: 'Network',
          macAddress: discovered.macAddress,
          driverName: discovered.model,
        },
        capabilities: {
          color: true, // Default values
          duplex: true,
          maxPaperSize: 'A4',
          supportedPaperTypes: ['Plain', 'Photo'],
        },
        pricing: {
          colorPerPage: 2.0,
          bwPerPage: 1.0,
        },
        isActive: true,
        lastKnownErrors: [],
      });

      await newPrinter.save();
      console.log(`✅ Added ${discovered.name} to database`);
      addedCount++;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Discovery complete!`);
    console.log(`   Added: ${addedCount} printer(s)`);
    console.log(`   Skipped: ${skippedCount} printer(s) (already exists)`);
    console.log(`   Total discovered: ${discoveredPrinters.length}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Configure printer settings in the admin panel');
    console.log('   2. Set up pricing for each printer');
    console.log('   3. Start the server to begin monitoring');
    console.log('   4. Test printing to verify connectivity\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    rl.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}

main();
