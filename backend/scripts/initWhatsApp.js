const { initializeWhatsApp, getClientHealth, shutdownClient } = require('../config/whatsapp');
const whatsappService = require('../services/whatsappService');
const fs = require('fs');
const path = require('path');

/**
 * WhatsApp Initialization Helper Script
 * 
 * This script helps set up and configure the WhatsApp client for the application.
 * It includes health checks, session management, and troubleshooting helpers.
 */

class WhatsAppInitHelper {
    constructor() {
        this.isInitialized = false;
        this.monitoringInterval = null;
    }

    /**
     * Display welcome message and setup information
     */
    displayWelcome() {
        console.log('\n🚀 WhatsApp Client Initialization Helper');
        console.log('=========================================\n');
        console.log('This script will help you:');
        console.log('• Initialize the WhatsApp client');
        console.log('• Set up proper session management');
        console.log('• Configure event handlers');
        console.log('• Verify connection health');
        console.log('• Troubleshoot common issues\n');
    }

    /**
     * Check system requirements and environment
     */
    async checkSystemRequirements() {
        console.log('🔍 Checking system requirements...\n');
        
        const checks = [];
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`📦 Node.js version: ${nodeVersion}`);
        checks.push({
            name: 'Node.js',
            status: nodeVersion.startsWith('v16') || nodeVersion.startsWith('v18') || nodeVersion.startsWith('v20'),
            message: 'Node.js 16+ recommended'
        });
        
        // Check if session directory exists and is writable
        const sessionDir = path.join(__dirname, '..', '.wwebjs_auth');
        try {
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }
            fs.accessSync(sessionDir, fs.constants.W_OK);
            console.log(`📁 Session directory: ${sessionDir} ✅`);
            checks.push({
                name: 'Session Directory',
                status: true,
                message: 'Directory exists and is writable'
            });
        } catch (error) {
            console.log(`📁 Session directory: ${sessionDir} ❌`);
            checks.push({
                name: 'Session Directory',
                status: false,
                message: `Error: ${error.message}`
            });
        }
        
        // Check available memory
        const memUsage = process.memoryUsage();
        const freeMem = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`💾 Memory usage: ${freeMem.toFixed(2)} MB`);
        checks.push({
            name: 'Memory',
            status: freeMem < 500, // Less than 500MB should be fine
            message: 'Memory usage looks good'
        });
        
        // Check required packages
        try {
            require('whatsapp-web.js');
            console.log('📦 whatsapp-web.js package: ✅');
            checks.push({
                name: 'WhatsApp Package',
                status: true,
                message: 'Package installed'
            });
        } catch (error) {
            console.log('📦 whatsapp-web.js package: ❌');
            checks.push({
                name: 'WhatsApp Package',
                status: false,
                message: 'Package not found - run npm install'
            });
        }
        
        console.log('\n📋 System Requirements Summary:');
        checks.forEach(check => {
            const status = check.status ? '✅' : '❌';
            console.log(`   ${status} ${check.name}: ${check.message}`);
        });
        
        const allPassed = checks.every(check => check.status);
        console.log(`\n${allPassed ? '✅' : '❌'} System requirements: ${allPassed ? 'PASSED' : 'FAILED'}\n`);
        
        return allPassed;
    }

    /**
     * Initialize WhatsApp client with monitoring
     */
    async initializeClient() {
        console.log('🔄 Initializing WhatsApp client...\n');
        
        try {
            // Start initialization
            await initializeWhatsApp();
            console.log('✅ Client initialization started\n');
            
            // Start monitoring
            this.startMonitoring();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize client:', error.message);
            console.log('\n🔧 Troubleshooting suggestions:');
            console.log('   • Check internet connection');
            console.log('   • Verify Chrome/Chromium is installed');
            console.log('   • Clear session directory if corrupted');
            console.log('   • Make sure no other WhatsApp Web sessions are active\n');
            
            return false;
        }
    }

    /**
     * Start monitoring client status
     */
    startMonitoring() {
        console.log('👀 Starting status monitoring...\n');
        
        this.monitoringInterval = setInterval(() => {
            this.displayStatus();
        }, 5000);
        
        // Initial status display
        this.displayStatus();
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Display current client status
     */
    displayStatus() {
        const health = getClientHealth();
        const serviceStats = whatsappService.getServiceStats();
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`📊 Status Update [${timestamp}]:`);
        console.log(`   🔗 Connection State: ${health.state || 'UNKNOWN'}`);
        console.log(`   ✅ Ready: ${health.isReady ? 'YES' : 'NO'}`);
        console.log(`   🔐 Authenticated: ${health.isAuthenticated ? 'YES' : 'NO'}`);
        console.log(`   📱 QR Available: ${health.hasQR ? 'YES' : 'NO'}`);
        console.log(`   🔄 Service State: ${serviceStats.connectionState}`);
        console.log(`   📈 Connection Attempts: ${health.connectionAttempts}/${3}`);
        console.log(`   ⏰ Last Seen: ${health.lastSeen || 'Never'}`);
        console.log('   ────────────────────────────────────────\n');
        
        // Show instructions based on state
        if (health.hasQR && !health.isReady) {
            console.log('📱 ACTION REQUIRED: Scan QR code with WhatsApp');
            console.log('   1. Open WhatsApp on your phone');
            console.log('   2. Go to Settings > Linked Devices');
            console.log('   3. Tap "Link a Device"');
            console.log('   4. Scan the QR code displayed above\n');
        }
        
        if (health.isReady) {
            console.log('🎉 SUCCESS! WhatsApp client is ready for messaging!\n');
            this.onClientReady();
        }
    }

    /**
     * Handle client ready state
     */
    async onClientReady() {
        if (this.isInitialized) return;
        
        this.isInitialized = true;
        this.stopMonitoring();
        
        try {
            console.log('🧪 Testing client functionality...\n');
            
            // Test service functions
            const stats = whatsappService.getServiceStats();
            console.log('📊 Service Statistics:');
            console.log(`   • Ready: ${stats.isReady}`);
            console.log(`   • State: ${stats.connectionState}`);
            console.log(`   • Has QR: ${stats.hasQR}\n`);
            
            // Test client info
            const clientInfo = await whatsappService.getClientInfo();
            if (clientInfo) {
                console.log('ℹ️ Client Information:');
                console.log(`   • Name: ${clientInfo.pushname || 'Not set'}`);
                console.log(`   • Phone: ${clientInfo.wid?.user || 'Unknown'}`);
                console.log(`   • Battery: ${clientInfo.battery || 'Unknown'}%`);
                console.log(`   • Platform: ${clientInfo.platform || 'Unknown'}\n`);
            }
            
            console.log('✅ All tests passed! WhatsApp client is fully operational.\n');
            console.log('🚀 You can now start your application server.\n');
            
        } catch (error) {
            console.error('❌ Error testing client functionality:', error.message);
        }
    }

    /**
     * Clean session data (use with caution)
     */
    async cleanSession() {
        console.log('🧹 Cleaning session data...\n');
        
        const sessionDir = path.join(__dirname, '..', '.wwebjs_auth');
        
        try {
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log('✅ Session data cleaned successfully');
                console.log('⚠️ You will need to scan QR code again\n');
            } else {
                console.log('ℹ️ No session data found to clean\n');
            }
        } catch (error) {
            console.error('❌ Error cleaning session data:', error.message);
        }
    }

    /**
     * Run complete initialization process
     */
    async run() {
        this.displayWelcome();
        
        // Check system requirements
        const requirementsPassed = await this.checkSystemRequirements();
        if (!requirementsPassed) {
            console.log('❌ System requirements not met. Please fix the issues above and try again.\n');
            process.exit(1);
        }
        
        // Initialize client
        const initialized = await this.initializeClient();
        if (!initialized) {
            console.log('❌ Client initialization failed. See troubleshooting suggestions above.\n');
            process.exit(1);
        }
        
        // Set up graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down WhatsApp initialization helper...');
            this.stopMonitoring();
            
            try {
                await shutdownClient();
                console.log('✅ WhatsApp client shut down gracefully');
            } catch (error) {
                console.error('❌ Error during shutdown:', error.message);
            }
            
            process.exit(0);
        });
        
        // Keep the process running for monitoring
        console.log('💡 Monitoring client status... Press Ctrl+C to stop.\n');
    }
}

// CLI interface
if (require.main === module) {
    const helper = new WhatsAppInitHelper();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--clean')) {
        helper.cleanSession().then(() => process.exit(0));
    } else if (args.includes('--check')) {
        helper.checkSystemRequirements().then(() => process.exit(0));
    } else if (args.includes('--help')) {
        console.log('\n🆘 WhatsApp Initialization Helper - Usage:');
        console.log('');
        console.log('  node initWhatsApp.js           # Run full initialization');
        console.log('  node initWhatsApp.js --check   # Check system requirements only');
        console.log('  node initWhatsApp.js --clean   # Clean session data');
        console.log('  node initWhatsApp.js --help    # Show this help\n');
        process.exit(0);
    } else {
        helper.run().catch(console.error);
    }
}

module.exports = WhatsAppInitHelper; 