# wmi-nodejs

[![npm version](https://badge.fury.io/js/wmi-nodejs.svg)](https://badge.fury.io/js/wmi-nodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Node.js binding for Windows Management Instrumentation (WMI) built with Rust and napi-rs. This package provides direct WMI access without depending on external system tools like `wmic.exe`.

## Features

- 🚀 **High Performance**: Built with Rust for optimal performance
- 🔧 **Simple API**: Clean and intuitive interface for WMI queries
- 📊 **Direct Object Return**: Returns JavaScript objects directly, no JSON parsing needed
- 🎯 **Namespace Support**: Connect to any WMI namespace
- 🛡️ **No External Dependencies**: No reliance on system wmic tool
- 💻 **Windows Native**: Leverages native Windows WMI capabilities
- 🔄 **Backward Compatible**: String API still available for existing code

## Installation

```bash
npm install wmi-nodejs
```

**Requirements:**
- Windows operating system
- Node.js 12.0.0 or higher

## Quick Start

```javascript
const { WmiClient, quickQuery } = require('wmi-nodejs');

// Create a WMI client with default namespace
const client = new WmiClient();

// NEW: Query returns JavaScript objects directly (no JSON.parse needed!)
const osInfo = client.query('SELECT Caption, Version FROM Win32_OperatingSystem');
console.log(osInfo[0].Caption); // Direct property access
console.log(osInfo[0].Version);

// NEW: Quick query also returns objects directly
const processes = quickQuery('SELECT ProcessId, Name FROM Win32_Process WHERE Name = "explorer.exe"');
processes.forEach(proc => {
    console.log(`PID: ${proc.ProcessId}, Name: ${proc.Name}`);
});
```

## API Reference

### WmiClient Class

#### Constructor

```javascript
new WmiClient(config?)
```

Creates a new WMI client instance.

**Parameters:**
- `config` (Object, optional): Configuration object
  - `namespace` (string, optional): WMI namespace path. Default: `'root/cimv2'`
  - `timeout` (number, optional): Query timeout in milliseconds (reserved for future use)

**Example:**
```javascript
// Default namespace (root/cimv2)
const client = new WmiClient();

// Custom namespace
const hypervClient = new WmiClient({ 
    namespace: 'root/virtualization/v2' 
});
```

#### Methods

##### client.query(wql) ⭐ NEW

Executes a WQL (WMI Query Language) query and returns JavaScript objects directly.

**Parameters:**
- `wql` (string): WQL query string

**Returns:**
- `Array<Object>`: Array of JavaScript objects containing query results

**Example:**
```javascript
const result = client.query('SELECT * FROM Win32_ComputerSystem');
// No JSON.parse() needed!
console.log(result[0].Name);
console.log(result[0].TotalPhysicalMemory);
```

##### client.queryString(wql)

Executes a WQL query and returns results as JSON string (backward compatibility).

**Parameters:**
- `wql` (string): WQL query string

**Returns:**
- `string`: JSON string containing query results

**Example:**
```javascript
const result = client.queryString('SELECT * FROM Win32_ComputerSystem');
const data = JSON.parse(result); // Manual parsing required
console.log(data);
```

##### client.getNamespace()

Returns the current namespace of the WMI connection.

**Returns:**
- `string`: Current namespace path

**Example:**
```javascript
console.log(client.getNamespace()); // "root/cimv2"
```

##### client.testConnection()

Tests if the WMI connection is working properly.

**Returns:**
- `boolean`: Connection status

**Example:**
```javascript
if (client.testConnection()) {
    console.log('WMI connection is active');
}
```

### Quick Query Functions

#### quickQuery(wql, namespace?) ⭐ NEW

Executes a quick WMI query without creating a client instance. Returns JavaScript objects directly.

**Parameters:**
- `wql` (string): WQL query string
- `namespace` (string, optional): WMI namespace path

**Returns:**
- `Array<Object>`: Array of JavaScript objects

**Example:**
```javascript
// Returns objects directly
const result = quickQuery('SELECT * FROM Win32_Process');
result.forEach(proc => console.log(proc.Name));

// Custom namespace  
const vms = quickQuery('SELECT * FROM Msvm_ComputerSystem', 'root/virtualization/v2');
```

#### quickQueryString(wql, namespace?)

Executes a quick WMI query and returns JSON string (backward compatibility).

**Parameters:**
- `wql` (string): WQL query string
- `namespace` (string, optional): WMI namespace path

**Returns:**
- `string`: JSON string containing query results

**Example:**
```javascript
const result = quickQueryString('SELECT * FROM Win32_Process');
const data = JSON.parse(result);
```

## Usage Examples

### System Information (New Object API)

```javascript
const { WmiClient } = require('wmi-nodejs');
const client = new WmiClient();

// Operating System - Direct object access!
const os = client.query('SELECT Caption, Version, BuildNumber FROM Win32_OperatingSystem');
console.log(`OS: ${os[0].Caption}`);
console.log(`Version: ${os[0].Version}`);
console.log(`Build: ${os[0].BuildNumber}`);

// Processor Information
const cpu = client.query('SELECT Name, NumberOfCores, MaxClockSpeed FROM Win32_Processor');
cpu.forEach(processor => {
    console.log(`CPU: ${processor.Name}`);
    console.log(`Cores: ${processor.NumberOfCores}`);
    console.log(`Speed: ${processor.MaxClockSpeed} MHz`);
});

// Memory Information
const memory = client.query('SELECT Capacity, Speed FROM Win32_PhysicalMemory');
memory.forEach(stick => {
    console.log(`Memory: ${Math.round(stick.Capacity / 1024 / 1024 / 1024)} GB`);
    console.log(`Speed: ${stick.Speed} MHz`);
});

// Disk Drives
const disks = client.query('SELECT DeviceID, Size, FreeSpace FROM Win32_LogicalDisk WHERE DriveType = 3');
disks.forEach(disk => {
    const totalGB = Math.round(disk.Size / 1024 / 1024 / 1024);
    const freeGB = Math.round(disk.FreeSpace / 1024 / 1024 / 1024);
    console.log(`Drive ${disk.DeviceID} ${totalGB}GB total, ${freeGB}GB free`);
});
```

### Process and Service Management

```javascript
// Running Processes
const processes = client.query('SELECT ProcessId, Name, WorkingSetSize FROM Win32_Process');
processes.forEach(proc => {
    if (proc.WorkingSetSize > 100000000) { // > 100MB
        console.log(`${proc.Name} (PID: ${proc.ProcessId}) - ${Math.round(proc.WorkingSetSize/1024/1024)}MB`);
    }
});

// Windows Services
const services = client.query('SELECT Name, State, StartMode FROM Win32_Service WHERE State = "Running"');
console.log(`Running services: ${services.length}`);
services.slice(0, 5).forEach(service => {
    console.log(`${service.Name}: ${service.State} (${service.StartMode})`);
});

// Network Adapters
const adapters = client.query('SELECT Name, NetConnectionStatus FROM Win32_NetworkAdapter WHERE NetConnectionStatus = 2');
adapters.forEach(adapter => {
    console.log(`Active adapter: ${adapter.Name}`);
});
```

### Hyper-V Virtual Machines

```javascript
const hypervClient = new WmiClient({ namespace: 'root/virtualization/v2' });

// Virtual Machines
const vms = hypervClient.query('SELECT ElementName, EnabledState FROM Msvm_ComputerSystem WHERE Caption = "Virtual Machine"');
vms.forEach(vm => {
    const state = vm.EnabledState === 2 ? 'Running' : vm.EnabledState === 3 ? 'Off' : 'Other';
    console.log(`VM: ${vm.ElementName} - ${state}`);
});

// Virtual Machine Settings
const vmSettings = hypervClient.query('SELECT ElementName, ConfigurationDataRoot FROM Msvm_VirtualSystemSettingData');
vmSettings.forEach(setting => {
    console.log(`VM Config: ${setting.ElementName}`);
});
```

### Working with Complex Data Types

```javascript
// Network configuration with arrays
const configs = client.query(`
    SELECT Description, IPAddress, SubnetMask, DefaultIPGateway 
    FROM Win32_NetworkAdapterConfiguration 
    WHERE IPEnabled = TRUE
`);

configs.forEach(config => {
    console.log(`Adapter: ${config.Description}`);
    
    // Handle array properties directly
    if (config.IPAddress && Array.isArray(config.IPAddress)) {
        config.IPAddress.forEach(ip => console.log(`  IP: ${ip}`));
    }
    
    if (config.DefaultIPGateway && Array.isArray(config.DefaultIPGateway)) {
        config.DefaultIPGateway.forEach(gw => console.log(`  Gateway: ${gw}`));
    }
});
```

## Migration Guide

### Upgrading from String API to Object API

**Old way (still works):**
```javascript
const result = client.queryString('SELECT * FROM Win32_Process');
const data = JSON.parse(result);
data.forEach(proc => console.log(proc.Name));
```

**New way (recommended):**
```javascript
const result = client.query('SELECT * FROM Win32_Process');
result.forEach(proc => console.log(proc.Name));
```

### Benefits of Object API

- ✅ **No manual parsing**: Direct JavaScript object access
- ✅ **Better performance**: No JSON string parsing overhead
- ✅ **Type safety**: Better TypeScript support
- ✅ **Cleaner code**: Less boilerplate
- ✅ **Error reduction**: No JSON.parse() errors

## Common WMI Namespaces

| Namespace | Description |
|-----------|-------------|
| `root/cimv2` | Default namespace with system information |
| `root/virtualization/v2` | Hyper-V virtualization information |
| `root/wmi` | Windows management instrumentation |
| `root/directory/ldap` | Active Directory information |
| `root/microsoft/windows/storage` | Storage management |

## WQL Query Examples

WQL (WMI Query Language) is similar to SQL but designed for WMI objects.

### Basic Syntax

```sql
-- Select all properties
SELECT * FROM Win32_Process

-- Select specific properties
SELECT ProcessId, Name, WorkingSetSize FROM Win32_Process

-- Filter results
SELECT * FROM Win32_Service WHERE State = 'Running'

-- Use wildcards
SELECT * FROM Win32_Process WHERE Name LIKE '%explorer%'

-- Multiple conditions
SELECT * FROM Win32_LogicalDisk WHERE DriveType = 3 AND FreeSpace > 1000000000
```

### Common WMI Classes

| Class | Description |
|-------|-------------|
| `Win32_OperatingSystem` | Operating system information |
| `Win32_Processor` | CPU information |
| `Win32_PhysicalMemory` | RAM information |
| `Win32_LogicalDisk` | Disk drive information |
| `Win32_Process` | Running processes |
| `Win32_Service` | Windows services |
| `Win32_NetworkAdapter` | Network adapters |
| `Win32_ComputerSystem` | Computer system information |

## Performance Tips

1. **Use Object API**: New object API is faster than string API
2. **Specific Queries**: Select only needed properties instead of using `SELECT *`
3. **Use Filters**: Apply WHERE clauses to reduce result set size  
4. **Connection Reuse**: Reuse WmiClient instances for multiple queries
5. **Namespace Selection**: Use the most specific namespace for your queries

## Troubleshooting

### Common Issues

**Access Denied Errors:**
- Run Node.js as Administrator for certain WMI namespaces
- Check user permissions for WMI access

**Invalid Namespace:**
- Verify namespace exists: `quickQuery('SELECT * FROM __Namespace')`
- Check spelling and case sensitivity

**Query Timeouts:**
- Simplify complex queries
- Add WHERE clauses to limit results
- Check system performance

### Debug Information

```javascript
const client = new WmiClient();

// Test connection
console.log('Connection OK:', client.testConnection());

// Current namespace
console.log('Namespace:', client.getNamespace());

// Available namespaces
const namespaces = quickQuery('SELECT Name FROM __Namespace');
console.log('Available namespaces:', namespaces);
```

## Building from Source

```bash
# Clone repository
git clone <repository-url>
cd wmi-nodejs

# Install dependencies
npm install

# Build native module
npm run build

# Run tests
npm test
```

## Requirements

- **OS**: Windows 10/11, Windows Server 2016+
- **Node.js**: 12.0.0 or higher
- **Architecture**: x64

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [wmi-rs](https://github.com/ohadravid/wmi-rs) - Rust WMI library (underlying implementation)
- [node-wmi](https://github.com/node-wmi/node-wmi) - Alternative Node.js WMI binding

## Support

- 📖 [Documentation](README.md)
- 🐛 [Issue Tracker](issues)
- 💬 [Discussions](discussions)

---

**Note**: This package is designed specifically for Windows environments and requires WMI support. 