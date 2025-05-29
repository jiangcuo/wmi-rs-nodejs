# wmi-nodejs

[![npm version](https://badge.fury.io/js/wmi-nodejs.svg)](https://badge.fury.io/js/wmi-nodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Node.js binding for Windows Management Instrumentation (WMI) built with Rust and napi-rs. This package provides direct WMI access without depending on external system tools like `wmic.exe`.

## Features

- 🚀 **High Performance**: Built with Rust for optimal performance
- 🔧 **Simple API**: Clean and intuitive interface for WMI queries
- 📊 **JSON Output**: Direct JSON format results, no parsing required
- 🎯 **Namespace Support**: Connect to any WMI namespace
- 🛡️ **No External Dependencies**: No reliance on system wmic tool
- 💻 **Windows Native**: Leverages native Windows WMI capabilities

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

// Query operating system information
const osInfo = client.query('SELECT Caption, Version FROM Win32_OperatingSystem');
console.log(JSON.parse(osInfo));

// Quick query without creating a client instance
const processes = quickQuery('SELECT ProcessId, Name FROM Win32_Process WHERE Name = "explorer.exe"');
console.log(JSON.parse(processes));
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

##### client.query(wql)

Executes a WQL (WMI Query Language) query and returns results as JSON.

**Parameters:**
- `wql` (string): WQL query string

**Returns:**
- `string`: JSON string containing query results

**Example:**
```javascript
const result = client.query('SELECT * FROM Win32_ComputerSystem');
const data = JSON.parse(result);
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

### quickQuery Function

```javascript
quickQuery(wql, namespace?)
```

Executes a quick WMI query without creating a client instance.

**Parameters:**
- `wql` (string): WQL query string
- `namespace` (string, optional): WMI namespace path

**Returns:**
- `string`: JSON string containing query results

**Example:**
```javascript
// Default namespace
const result1 = quickQuery('SELECT * FROM Win32_Process');

// Custom namespace  
const result2 = quickQuery('SELECT * FROM Msvm_ComputerSystem', 'root/virtualization/v2');
```

## Common WMI Namespaces

| Namespace | Description |
|-----------|-------------|
| `root/cimv2` | Default namespace with system information |
| `root/virtualization/v2` | Hyper-V virtualization information |
| `root/wmi` | Windows management instrumentation |
| `root/directory/ldap` | Active Directory information |
| `root/microsoft/windows/storage` | Storage management |

## Usage Examples

### System Information

```javascript
const { WmiClient } = require('wmi-nodejs');
const client = new WmiClient();

// Operating System
const os = client.query('SELECT Caption, Version, BuildNumber FROM Win32_OperatingSystem');
console.log('OS Info:', JSON.parse(os));

// Processor
const cpu = client.query('SELECT Name, NumberOfCores, MaxClockSpeed FROM Win32_Processor');
console.log('CPU Info:', JSON.parse(cpu));

// Memory
const memory = client.query('SELECT Capacity, Speed FROM Win32_PhysicalMemory');
console.log('Memory Info:', JSON.parse(memory));

// Disk Drives
const disks = client.query('SELECT DeviceID, Size, FreeSpace FROM Win32_LogicalDisk WHERE DriveType = 3');
console.log('Disk Info:', JSON.parse(disks));
```

### Process and Service Management

```javascript
// Running Processes
const processes = client.query('SELECT ProcessId, Name, WorkingSetSize FROM Win32_Process');
console.log('Processes:', JSON.parse(processes));

// Windows Services
const services = client.query('SELECT Name, State, StartMode FROM Win32_Service WHERE State = "Running"');
console.log('Services:', JSON.parse(services));

// Network Adapters
const adapters = client.query('SELECT Name, NetConnectionStatus FROM Win32_NetworkAdapter WHERE NetConnectionStatus = 2');
console.log('Network Adapters:', JSON.parse(adapters));
```

### Hyper-V Virtual Machines

```javascript
const hypervClient = new WmiClient({ namespace: 'root/virtualization/v2' });

// Virtual Machines
const vms = hypervClient.query('SELECT ElementName, EnabledState FROM Msvm_ComputerSystem WHERE Caption = "Virtual Machine"');
console.log('Virtual Machines:', JSON.parse(vms));

// Virtual Machine Settings
const vmSettings = hypervClient.query('SELECT * FROM Msvm_VirtualSystemSettingData');
console.log('VM Settings:', JSON.parse(vmSettings));
```

### Error Handling

```javascript
const { WmiClient } = require('wmi-nodejs');

try {
    const client = new WmiClient({ namespace: 'root/invalid' });
    const result = client.query('SELECT * FROM InvalidClass');
    console.log(JSON.parse(result));
} catch (error) {
    console.error('WMI Query failed:', error.message);
}
```

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

1. **Specific Queries**: Select only needed properties instead of using `SELECT *`
2. **Use Filters**: Apply WHERE clauses to reduce result set size  
3. **Connection Reuse**: Reuse WmiClient instances for multiple queries
4. **Namespace Selection**: Use the most specific namespace for your queries

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
console.log('Available namespaces:', JSON.parse(namespaces));
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