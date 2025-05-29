#!/usr/bin/env node

/**
 * WMI Node.js Object API Examples
 * 
 * This file demonstrates the new JavaScript Object API that returns
 * objects directly without requiring JSON.parse().
 * 
 * Run this file with: node example-object-api.js
 */

const { WmiClient, quickQuery, quickQueryString } = require('./index.js');

// Utility function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Example 1: Basic Object API Usage
 */
function example1_BasicObjectAPI() {
    console.log('='.repeat(60));
    console.log('Example 1: Basic Object API Usage');
    console.log('='.repeat(60));

    const client = new WmiClient();
    
    // Operating System - Direct object access!
    console.log('📊 Operating System (Object API):');
    console.log('-'.repeat(40));
    const osInfo = client.query('SELECT Caption, Version, BuildNumber FROM Win32_OperatingSystem');
    
    // No JSON.parse() needed - direct property access!
    const os = osInfo[0];
    console.log(`OS: ${os.Caption}`);
    console.log(`Version: ${os.Version}`);
    console.log(`Build: ${os.BuildNumber}\n`);
    
    // Computer System Information
    console.log('💻 Computer System (Object API):');
    console.log('-'.repeat(40));
    const systemInfo = client.query('SELECT Name, Manufacturer, Model, TotalPhysicalMemory FROM Win32_ComputerSystem');
    
    const system = systemInfo[0];
    console.log(`Computer: ${system.Name}`);
    console.log(`Manufacturer: ${system.Manufacturer}`);
    console.log(`Model: ${system.Model}`);
    console.log(`RAM: ${formatBytes(system.TotalPhysicalMemory)}\n`);
}

/**
 * Example 2: Working with Arrays and Loops
 */
function example2_ArraysAndLoops() {
    console.log('='.repeat(60));
    console.log('Example 2: Working with Arrays and Loops');
    console.log('='.repeat(60));

    const client = new WmiClient();
    
    // Process List - Direct iteration!
    console.log('🔥 Top Memory Consuming Processes (Object API):');
    console.log('-'.repeat(50));
    const processes = client.query('SELECT ProcessId, Name, WorkingSetSize FROM Win32_Process WHERE WorkingSetSize > 0');
    
    // Sort and display top 5 - direct object manipulation!
    processes
        .sort((a, b) => b.WorkingSetSize - a.WorkingSetSize)
        .slice(0, 5)
        .forEach((proc, index) => {
            console.log(`${index + 1}. ${proc.Name} (PID: ${proc.ProcessId})`);
            console.log(`   Memory: ${formatBytes(proc.WorkingSetSize)}`);
        });
    
    console.log('\n📋 Service Statistics (Object API):');
    console.log('-'.repeat(40));
    const services = client.query('SELECT State FROM Win32_Service');
    
    // Count services by state - direct object access!
    const stats = services.reduce((acc, service) => {
        acc[service.State] = (acc[service.State] || 0) + 1;
        return acc;
    }, {});
    
    Object.entries(stats).forEach(([state, count]) => {
        console.log(`${state}: ${count} services`);
    });
}

/**
 * Example 3: Complex Data Types (Arrays in Properties)
 */
function example3_ComplexDataTypes() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 3: Complex Data Types');
    console.log('='.repeat(60));

    const client = new WmiClient();
    
    console.log('🌐 Network Configuration (Object API with Arrays):');
    console.log('-'.repeat(50));
    
    const configs = client.query(`
        SELECT Description, IPAddress, SubnetMask, DefaultIPGateway, DHCPEnabled 
        FROM Win32_NetworkAdapterConfiguration 
        WHERE IPEnabled = TRUE
    `);
    
    configs.slice(0, 3).forEach((config, index) => {
        console.log(`\n📡 Adapter ${index + 1}: ${config.Description}`);
        
        // Handle array properties directly - no JSON parsing!
        if (config.IPAddress && Array.isArray(config.IPAddress)) {
            config.IPAddress.forEach(ip => {
                console.log(`   IP Address: ${ip}`);
            });
        }
        
        if (config.SubnetMask && Array.isArray(config.SubnetMask)) {
            config.SubnetMask.forEach(mask => {
                console.log(`   Subnet Mask: ${mask}`);
            });
        }
        
        if (config.DefaultIPGateway && Array.isArray(config.DefaultIPGateway)) {
            config.DefaultIPGateway.forEach(gateway => {
                console.log(`   Gateway: ${gateway}`);
            });
        }
        
        console.log(`   DHCP: ${config.DHCPEnabled ? 'Enabled' : 'Disabled'}`);
    });
}

/**
 * Example 4: Quick Query Object API
 */
function example4_QuickQueryObjectAPI() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 4: Quick Query Object API');
    console.log('='.repeat(60));

    console.log('⚡ Quick System Information:');
    console.log('-'.repeat(40));
    
    // Quick query returns objects directly!
    const systemInfo = quickQuery('SELECT Name, TotalPhysicalMemory FROM Win32_ComputerSystem');
    const system = systemInfo[0];
    console.log(`System: ${system.Name}`);
    console.log(`RAM: ${formatBytes(system.TotalPhysicalMemory)}\n`);
    
    console.log('⚡ Quick Disk Information:');
    console.log('-'.repeat(40));
    const disks = quickQuery('SELECT DeviceID, Size, FreeSpace FROM Win32_LogicalDisk WHERE DriveType = 3');
    
    disks.forEach(disk => {
        const totalGB = Math.round(disk.Size / 1024 / 1024 / 1024);
        const freeGB = Math.round(disk.FreeSpace / 1024 / 1024 / 1024);
        const usedPercent = (((disk.Size - disk.FreeSpace) / disk.Size) * 100).toFixed(1);
        console.log(`Drive ${disk.DeviceID} ${totalGB}GB (${usedPercent}% used, ${freeGB}GB free)`);
    });
    
    console.log('\n⚡ Quick Process Count:');
    console.log('-'.repeat(40));
    const processes = quickQuery('SELECT ProcessId FROM Win32_Process');
    console.log(`Total processes: ${processes.length}`);
}

/**
 * Example 5: Custom Namespace with Object API
 */
function example5_CustomNamespaceObjectAPI() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 5: Custom Namespace with Object API');
    console.log('='.repeat(60));

    try {
        const hypervClient = new WmiClient({ namespace: 'root/virtualization/v2' });
        console.log(`Connected to: ${hypervClient.getNamespace()}\n`);
        
        console.log('🖥️ Virtual Machines (Object API):');
        console.log('-'.repeat(40));
        
        const vms = hypervClient.query('SELECT ElementName, EnabledState FROM Msvm_ComputerSystem WHERE Caption = "Virtual Machine"');
        
        if (vms.length === 0) {
            console.log('No virtual machines found');
        } else {
            vms.forEach(vm => {
                const states = {
                    2: 'Running',
                    3: 'Off', 
                    6: 'Saved',
                    9: 'Paused'
                };
                console.log(`VM: ${vm.ElementName} - ${states[vm.EnabledState] || 'Unknown'}`);
            });
        }
        
        // Quick query with custom namespace
        console.log('\n⚡ Quick Hyper-V Query:');
        console.log('-'.repeat(40));
        const hostSystems = quickQuery(
            'SELECT ElementName FROM Msvm_ComputerSystem WHERE Caption = "Hosting Computer System"',
            'root/virtualization/v2'
        );
        
        if (hostSystems.length > 0) {
            console.log(`Host System: ${hostSystems[0].ElementName}`);
        }
        
    } catch (error) {
        console.log('ℹ️ Hyper-V namespace not available or insufficient permissions');
        console.log('   This is normal if Hyper-V is not installed');
    }
}

/**
 * Example 6: Comparison with String API
 */
function example6_ComparisonWithStringAPI() {
    console.log('\n' + '='.repeat(60));
    console.log('Example 6: Comparison - Object API vs String API');
    console.log('='.repeat(60));

    const client = new WmiClient();
    
    console.log('🆚 Object API vs String API Comparison:');
    console.log('-'.repeat(50));
    
    // Object API (NEW) - Clean and direct
    console.log('\n✅ Object API (Recommended):');
    const osInfoObj = client.query('SELECT Caption FROM Win32_OperatingSystem');
    console.log(`OS: ${osInfoObj[0].Caption}`);
    console.log('Code: osInfoObj[0].Caption (direct access)');
    
    // String API (OLD) - Still works but requires parsing
    console.log('\n🔄 String API (Backward Compatibility):');
    const osInfoStr = client.queryString('SELECT Caption FROM Win32_OperatingSystem');
    const parsed = JSON.parse(osInfoStr);
    console.log(`OS: ${parsed[0].Caption}`);
    console.log('Code: JSON.parse(osInfoStr)[0].Caption (requires parsing)');
    
    // Quick query comparison
    console.log('\n⚡ Quick Query Comparison:');
    console.log('-'.repeat(30));
    
    console.log('✅ quickQuery() - Returns objects:');
    const sysObj = quickQuery('SELECT Name FROM Win32_ComputerSystem');
    console.log(`System: ${sysObj[0].Name}`);
    
    console.log('\n🔄 quickQueryString() - Returns string:');
    const sysStr = quickQueryString('SELECT Name FROM Win32_ComputerSystem');
    const sysParsed = JSON.parse(sysStr);
    console.log(`System: ${sysParsed[0].Name}`);
}

/**
 * Main execution function
 */
function main() {
    console.log('🚀 WMI Node.js Object API Examples');
    console.log('==================================\n');
    console.log('This demonstrates the new Object API that returns JavaScript objects directly.');
    console.log('No more JSON.parse() required!\n');

    example1_BasicObjectAPI();
    example2_ArraysAndLoops();
    example3_ComplexDataTypes();
    example4_QuickQueryObjectAPI();
    example5_CustomNamespaceObjectAPI();
    example6_ComparisonWithStringAPI();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Object API examples completed!');
    console.log('='.repeat(60));
    
    console.log('\n🎯 Key Benefits of Object API:');
    console.log('- 🚀 No JSON.parse() required');
    console.log('- 🎯 Direct property access');
    console.log('- 🔧 Better performance');
    console.log('- 📝 Cleaner code');
    console.log('- 🛡️ Better TypeScript support');
    console.log('- ✅ Less error-prone');
    
    console.log('\n📚 Migration Tips:');
    console.log('- Replace client.queryString() with client.query()');
    console.log('- Replace quickQueryString() with quickQuery()');
    console.log('- Remove JSON.parse() calls');
    console.log('- String API still available for backward compatibility');
}

// Run examples if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    example1_BasicObjectAPI,
    example2_ArraysAndLoops,
    example3_ComplexDataTypes,
    example4_QuickQueryObjectAPI,
    example5_CustomNamespaceObjectAPI,
    example6_ComparisonWithStringAPI
}; 