#!/usr/bin/env node

/**
 * WMI Node.js Examples
 * 
 * This file demonstrates various ways to use the wmi-nodejs package
 * for querying Windows Management Instrumentation (WMI) data.
 * 
 * Run this file with: node example.js
 */

const { WmiClient, quickQuery } = require('./index.js');

// Utility function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Utility function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Example 1: Basic System Information
 * Demonstrates basic WMI queries for system information
 */
async function example1_SystemInfo() {
    console.log('='.repeat(60));
    console.log('Example 1: Basic System Information');
    console.log('='.repeat(60));

    try {
        const client = new WmiClient();
        console.log(`Connected to namespace: ${client.getNamespace()}`);
        console.log(`Connection status: ${client.testConnection() ? 'OK' : 'Failed'}\n`);

        // Operating System Information
        console.log('📊 Operating System Information:');
        console.log('-'.repeat(40));
        const osInfo = client.query('SELECT Caption, Version, BuildNumber, OSArchitecture, TotalVisibleMemorySize FROM Win32_OperatingSystem');
        const osData = JSON.parse(osInfo)[0];
        console.log(`OS: ${osData.Caption}`);
        console.log(`Version: ${osData.Version} (Build ${osData.BuildNumber})`);
        console.log(`Architecture: ${osData.OSArchitecture}`);
        console.log(`Total RAM: ${formatBytes(osData.TotalVisibleMemorySize * 1024)}\n`);

        // Computer System Information
        console.log('💻 Computer System Information:');
        console.log('-'.repeat(40));
        const systemInfo = client.query('SELECT Name, Manufacturer, Model, TotalPhysicalMemory FROM Win32_ComputerSystem');
        const systemData = JSON.parse(systemInfo)[0];
        console.log(`Computer Name: ${systemData.Name}`);
        console.log(`Manufacturer: ${systemData.Manufacturer}`);
        console.log(`Model: ${systemData.Model}`);
        console.log(`Physical Memory: ${formatBytes(systemData.TotalPhysicalMemory)}\n`);

        // Processor Information
        console.log('🔧 Processor Information:');
        console.log('-'.repeat(40));
        const cpuInfo = client.query('SELECT Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed FROM Win32_Processor');
        const cpuData = JSON.parse(cpuInfo);
        cpuData.forEach((cpu, index) => {
            console.log(`CPU ${index + 1}: ${cpu.Name}`);
            console.log(`  Cores: ${cpu.NumberOfCores}, Logical Processors: ${cpu.NumberOfLogicalProcessors}`);
            console.log(`  Max Clock Speed: ${cpu.MaxClockSpeed} MHz`);
        });

    } catch (error) {
        console.error('❌ Error in Example 1:', error.message);
    }
}

/**
 * Example 2: Disk and Storage Information
 * Shows how to query disk drives and storage information
 */
async function example2_StorageInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 2: Disk and Storage Information');
    console.log('='.repeat(60));

    try {
        const client = new WmiClient();

        // Logical Disks
        console.log('💾 Logical Disk Drives:');
        console.log('-'.repeat(40));
        const disks = client.query('SELECT DeviceID, Size, FreeSpace, FileSystem, DriveType FROM Win32_LogicalDisk WHERE DriveType = 3');
        const diskData = JSON.parse(disks);
        
        diskData.forEach(disk => {
            const usedSpace = disk.Size - disk.FreeSpace;
            const usagePercent = ((usedSpace / disk.Size) * 100).toFixed(1);
            
            console.log(`Drive ${disk.DeviceID}`);
            console.log(`  File System: ${disk.FileSystem}`);
            console.log(`  Total Size: ${formatBytes(disk.Size)}`);
            console.log(`  Free Space: ${formatBytes(disk.FreeSpace)}`);
            console.log(`  Used Space: ${formatBytes(usedSpace)} (${usagePercent}%)\n`);
        });

        // Physical Disks
        console.log('🔧 Physical Disk Drives:');
        console.log('-'.repeat(40));
        const physicalDisks = client.query('SELECT DeviceID, Model, Size, MediaType FROM Win32_DiskDrive');
        const physicalData = JSON.parse(physicalDisks);
        
        physicalData.forEach(disk => {
            console.log(`${disk.DeviceID}: ${disk.Model || 'Unknown Model'}`);
            console.log(`  Size: ${formatBytes(disk.Size)}`);
            console.log(`  Media Type: ${disk.MediaType || 'Unknown'}\n`);
        });

    } catch (error) {
        console.error('❌ Error in Example 2:', error.message);
    }
}

/**
 * Example 3: Process Management
 * Demonstrates querying running processes and services
 */
async function example3_ProcessManagement() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 3: Process and Service Management');
    console.log('='.repeat(60));

    try {
        const client = new WmiClient();

        // Top Memory Consuming Processes
        console.log('🔥 Top 10 Memory Consuming Processes:');
        console.log('-'.repeat(50));
        const processes = client.query('SELECT ProcessId, Name, WorkingSetSize FROM Win32_Process WHERE WorkingSetSize > 0');
        const processData = JSON.parse(processes)
            .sort((a, b) => b.WorkingSetSize - a.WorkingSetSize)
            .slice(0, 10);
        
        processData.forEach((proc, index) => {
            console.log(`${index + 1}. ${proc.Name} (PID: ${proc.ProcessId})`);
            console.log(`   Memory: ${formatBytes(proc.WorkingSetSize)}`);
        });

        // Running Services Count
        console.log('\n📋 Windows Services Status:');
        console.log('-'.repeat(40));
        const services = client.query('SELECT State FROM Win32_Service');
        const serviceData = JSON.parse(services);
        
        const serviceStats = serviceData.reduce((acc, service) => {
            acc[service.State] = (acc[service.State] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(serviceStats).forEach(([state, count]) => {
            console.log(`${state}: ${count} services`);
        });

        // Critical Services (Running)
        console.log('\n🛡️ Critical Running Services:');
        console.log('-'.repeat(40));
        const criticalServices = client.query(`
            SELECT Name, DisplayName, State FROM Win32_Service 
            WHERE State = 'Running' AND (
                Name LIKE '%Windows%' OR 
                Name LIKE '%System%' OR 
                Name = 'Winmgmt' OR 
                Name = 'RpcSs' OR 
                Name = 'Dhcp'
            )
        `);
        const criticalData = JSON.parse(criticalServices).slice(0, 8);
        
        criticalData.forEach(service => {
            console.log(`${service.Name}: ${service.DisplayName || service.Name}`);
        });

    } catch (error) {
        console.error('❌ Error in Example 3:', error.message);
    }
}

/**
 * Example 4: Network Information
 * Shows network adapter and configuration queries
 */
async function example4_NetworkInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 4: Network Information');
    console.log('='.repeat(60));

    try {
        const client = new WmiClient();

        // Active Network Adapters
        console.log('🌐 Active Network Adapters:');
        console.log('-'.repeat(40));
        const adapters = client.query(`
            SELECT Name, NetConnectionStatus, Speed, MACAddress 
            FROM Win32_NetworkAdapter 
            WHERE NetConnectionStatus = 2 AND Speed IS NOT NULL
        `);
        const adapterData = JSON.parse(adapters);
        
        adapterData.forEach(adapter => {
            console.log(`📡 ${adapter.Name}`);
            console.log(`   MAC Address: ${adapter.MACAddress || 'N/A'}`);
            console.log(`   Speed: ${adapter.Speed ? formatBytes(adapter.Speed / 8) + '/s' : 'Unknown'}\n`);
        });

        // Network Configuration
        console.log('⚙️ IP Configuration:');
        console.log('-'.repeat(40));
        const configs = client.query(`
            SELECT Description, IPAddress, SubnetMask, DefaultIPGateway, DHCPEnabled 
            FROM Win32_NetworkAdapterConfiguration 
            WHERE IPEnabled = TRUE
        `);
        const configData = JSON.parse(configs);
        
        configData.forEach(config => {
            if (config.IPAddress && config.IPAddress.length > 0) {
                console.log(`🔧 ${config.Description}`);
                console.log(`   IP Address: ${config.IPAddress[0]}`);
                console.log(`   Subnet Mask: ${config.SubnetMask ? config.SubnetMask[0] : 'N/A'}`);
                console.log(`   Gateway: ${config.DefaultIPGateway ? config.DefaultIPGateway[0] : 'N/A'}`);
                console.log(`   DHCP: ${config.DHCPEnabled ? 'Enabled' : 'Disabled'}\n`);
            }
        });

    } catch (error) {
        console.error('❌ Error in Example 4:', error.message);
    }
}

/**
 * Example 5: Custom Namespace - Hyper-V
 * Demonstrates using custom namespaces for specialized queries
 */
async function example5_HyperV() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 5: Hyper-V Information (Custom Namespace)');
    console.log('='.repeat(60));

    try {
        const hypervClient = new WmiClient({ namespace: 'root/virtualization/v2' });
        console.log(`Connected to namespace: ${hypervClient.getNamespace()}`);

        // Virtual Machines
        console.log('🖥️ Virtual Machines:');
        console.log('-'.repeat(40));
        const vms = hypervClient.query(`
            SELECT ElementName, EnabledState, ProcessorLoad, MemoryUsage 
            FROM Msvm_ComputerSystem 
            WHERE Caption = 'Virtual Machine'
        `);
        const vmData = JSON.parse(vms);
        
        if (vmData.length === 0) {
            console.log('No virtual machines found or Hyper-V not available.');
        } else {
            vmData.forEach(vm => {
                const states = {
                    2: 'Running',
                    3: 'Off',
                    6: 'Saved',
                    9: 'Paused'
                };
                console.log(`VM: ${vm.ElementName}`);
                console.log(`   State: ${states[vm.EnabledState] || 'Unknown'}`);
                if (vm.ProcessorLoad !== null) {
                    console.log(`   CPU Load: ${vm.ProcessorLoad}%`);
                }
                console.log('');
            });
        }

        // Hyper-V Host Information
        console.log('🏠 Hyper-V Host Information:');
        console.log('-'.repeat(40));
        const hostInfo = hypervClient.query(`
            SELECT ElementName, TotalVisibleMemorySize, LogicalProcessors 
            FROM Msvm_ComputerSystem 
            WHERE Caption = 'Hosting Computer System'
        `);
        const hostData = JSON.parse(hostInfo);
        
        if (hostData.length > 0) {
            const host = hostData[0];
            console.log(`Host: ${host.ElementName}`);
            if (host.LogicalProcessors) {
                console.log(`Logical Processors: ${host.LogicalProcessors}`);
            }
        }

    } catch (error) {
        console.log('ℹ️ Hyper-V namespace not available or insufficient permissions');
        console.log('   This is normal if Hyper-V is not installed or enabled');
    }
}

/**
 * Example 6: Quick Query Functions
 * Demonstrates the quickQuery function for simple queries
 */
async function example6_QuickQueries() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 6: Quick Query Functions');
    console.log('='.repeat(60));

    try {
        // Quick system info
        console.log('⚡ Quick System Information:');
        console.log('-'.repeat(40));
        const quickSystem = quickQuery('SELECT Name, TotalPhysicalMemory FROM Win32_ComputerSystem');
        const systemInfo = JSON.parse(quickSystem)[0];
        console.log(`System: ${systemInfo.Name}`);
        console.log(`RAM: ${formatBytes(systemInfo.TotalPhysicalMemory)}\n`);

        // Quick process count
        console.log('⚡ Quick Process Count:');
        console.log('-'.repeat(40));
        const quickProcesses = quickQuery('SELECT ProcessId FROM Win32_Process');
        const processCount = JSON.parse(quickProcesses).length;
        console.log(`Total running processes: ${formatNumber(processCount)}\n`);

        // Quick disk usage
        console.log('⚡ Quick Disk Usage:');
        console.log('-'.repeat(40));
        const quickDisks = quickQuery('SELECT DeviceID, Size, FreeSpace FROM Win32_LogicalDisk WHERE DriveType = 3');
        const diskInfo = JSON.parse(quickDisks);
        
        diskInfo.forEach(disk => {
            const usagePercent = (((disk.Size - disk.FreeSpace) / disk.Size) * 100).toFixed(1);
            console.log(`${disk.DeviceID} ${usagePercent}% used`);
        });

        // Quick query with custom namespace
        console.log('\n⚡ Quick Query with Custom Namespace:');
        console.log('-'.repeat(40));
        try {
            const quickNamespaces = quickQuery('SELECT Name FROM __Namespace', 'root');
            const namespaces = JSON.parse(quickNamespaces);
            console.log(`Available root namespaces: ${namespaces.length} found`);
            namespaces.slice(0, 5).forEach(ns => console.log(`  - ${ns.Name}`));
        } catch (error) {
            console.log('Could not query root namespaces');
        }

    } catch (error) {
        console.error('❌ Error in Example 6:', error.message);
    }
}

/**
 * Example 7: Error Handling and Debugging
 * Shows proper error handling and debugging techniques
 */
async function example7_ErrorHandling() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 7: Error Handling and Debugging');
    console.log('='.repeat(60));

    // Test invalid namespace
    console.log('🔍 Testing Invalid Namespace:');
    console.log('-'.repeat(40));
    try {
        const invalidClient = new WmiClient({ namespace: 'root/invalid' });
        invalidClient.query('SELECT * FROM InvalidClass');
    } catch (error) {
        console.log(`✅ Caught expected error: ${error.message}\n`);
    }

    // Test invalid WQL
    console.log('🔍 Testing Invalid WQL Query:');
    console.log('-'.repeat(40));
    try {
        const client = new WmiClient();
        client.query('INVALID SQL SYNTAX');
    } catch (error) {
        console.log(`✅ Caught expected error: ${error.message}\n`);
    }

    // Debug information
    console.log('🔍 Debug Information:');
    console.log('-'.repeat(40));
    try {
        const debugClient = new WmiClient();
        console.log(`Connection test: ${debugClient.testConnection()}`);
        console.log(`Current namespace: ${debugClient.getNamespace()}`);
        
        // Available namespaces
        const namespaces = quickQuery('SELECT Name FROM __Namespace');
        const nsData = JSON.parse(namespaces);
        console.log(`Available namespaces in root: ${nsData.length}`);
        
        // Available classes in current namespace
        const classes = debugClient.query('SELECT * FROM Meta_Class WHERE __this ISA "Win32_BaseBoard"');
        console.log(`Queried base board info successfully: ${JSON.parse(classes).length > 0}`);

    } catch (error) {
        console.error('Debug query failed:', error.message);
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 WMI Node.js Examples');
    console.log('========================\n');
    console.log('This script demonstrates various WMI queries using the wmi-nodejs package.');
    console.log('Each example shows different aspects of WMI data access.\n');

    // Run all examples
    await example1_SystemInfo();
    await example2_StorageInfo();
    await example3_ProcessManagement();
    await example4_NetworkInfo();
    await example5_HyperV();
    await example6_QuickQueries();
    await example7_ErrorHandling();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(60));
    
    console.log('\n📚 Next Steps:');
    console.log('- Check the README.md for more API documentation');
    console.log('- Explore WMI classes at: https://docs.microsoft.com/en-us/windows/win32/cimwin32prov/');
    console.log('- Try your own WQL queries based on these examples');
    
    console.log('\n💡 Tips:');
    console.log('- Use specific SELECT clauses instead of SELECT * for better performance');
    console.log('- Add WHERE clauses to filter results and reduce data transfer');
    console.log('- Reuse WmiClient instances for multiple related queries');
    console.log('- Run with administrator privileges for accessing some WMI namespaces');
}

// Run examples if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Example execution failed:', error);
        process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
    example1_SystemInfo,
    example2_StorageInfo,
    example3_ProcessManagement,
    example4_NetworkInfo,
    example5_HyperV,
    example6_QuickQueries,
    example7_ErrorHandling,
    formatBytes,
    formatNumber
}; 