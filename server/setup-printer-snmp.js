/**
 * Quick Setup Script for SNMP Printer Monitoring
 * 
 * This script helps you add SNMP configuration to existing printers in the database.
 * 
 * Usage:
 *   node setup-printer-snmp.js
 */

const mongoose = require('mongoose');
const readline = require('node:readline');
require('dotenv').config();

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
  try {
    console.log('🖨️ SNMP Printer Configuration Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Get all printers
    const printers = await Printer.find({});
    
    if (printers.length === 0) {
      console.log('❌ No printers found in database.');
      console.log('Please add printers first before configuring SNMP.');
      process.exit(0);
    }

    console.log(`Found ${printers.length} printer(s):`);
    for (const [index, printer] of printers.entries()) {
      console.log(`${index + 1}. ${printer.name} (${printer.location})`);
      if (printer.systemInfo?.ipAddress) {
        console.log(`   Current IP: ${printer.systemInfo.ipAddress}`);
      } else {
        console.log(`   No IP configured`);
      }
    }
    console.log('');

    const printerIndex = await question('Select printer number to configure (or 0 to exit): ');
    const index = Number.parseInt(printerIndex) - 1;

    if (index < 0 || index >= printers.length) {
      console.log('Exiting...');
      process.exit(0);
    }

    const printer = printers[index];
    console.log('');
    console.log(`Configuring: ${printer.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Get IP address
    const currentIP = printer.systemInfo?.ipAddress || '';
    const ipAddress = await question(`Enter printer IP address [${currentIP}]: `);
    const finalIP = ipAddress.trim() || currentIP;

    if (!finalIP) {
      console.log('❌ IP address is required');
      process.exit(1);
    }

    // Get connection type
    console.log('');
    console.log('Connection types:');
    console.log('1. Network');
    console.log('2. USB');
    console.log('3. Virtual');
    console.log('4. Wireless');
    const connTypeNum = await question('Select connection type [1]: ');
    const connTypes = ['Network', 'USB', 'Virtual', 'Wireless'];
    const connectionType = connTypes[Number.parseInt(connTypeNum || '1') - 1] || 'Network';

    // Get MAC address (optional)
    const currentMAC = printer.systemInfo?.macAddress || '';
    const macAddress = await question(`Enter MAC address (optional) [${currentMAC}]: `);
    const finalMAC = macAddress.trim() || currentMAC;

    // Get driver name (optional)
    const currentDriver = printer.systemInfo?.driverName || '';
    const driverName = await question(`Enter driver name (optional) [${currentDriver}]: `);
    const finalDriver = driverName.trim() || currentDriver;

    console.log('');
    console.log('Configuration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Printer:      ${printer.name}`);
    console.log(`IP Address:   ${finalIP}`);
    console.log(`Connection:   ${connectionType}`);
    if (finalMAC) console.log(`MAC Address:  ${finalMAC}`);
    if (finalDriver) console.log(`Driver:       ${finalDriver}`);
    console.log('');

    const confirm = await question('Save this configuration? (yes/no) [yes]: ');
    if (confirm.toLowerCase() === 'no' || confirm.toLowerCase() === 'n') {
      console.log('Configuration cancelled.');
      process.exit(0);
    }

    // Update printer
    printer.systemInfo = {
      ipAddress: finalIP,
      connectionType,
      macAddress: finalMAC,
      driverName: finalDriver,
    };

    await printer.save();

    console.log('');
    console.log('✅ Printer configuration saved!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test SNMP connection:');
    console.log(`   node test-snmp-connection.js ${finalIP}`);
    console.log('2. Start the server to begin monitoring:');
    console.log('   npm run dev');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await -- CommonJS module
(async () => {
  await main();
})();
