# WMI Node.js 绑定 (简化版)

基于 Rust wmi-rs 的 Node.js 绑定，提供简洁的 WMI 查询功能。

## 功能特性

- ✅ 支持自定义命名空间
- ✅ 直接返回 JSON 格式结果
- ✅ 不依赖系统 wmic 工具
- ✅ 基于 Rust 实现，性能优异
- ✅ 简洁的 API 设计

## 安装

```bash
npm install
npm run build
```

## 基本用法

### 创建 WMI 客户端

```javascript
const { WmiClient } = require('./index.js');

// 使用默认命名空间 (root/cimv2)
const client = new WmiClient();

// 使用自定义命名空间
const hypervClient = new WmiClient({ 
    namespace: 'root/virtualization/v2' 
});
```

### 执行查询

```javascript
// 查询操作系统信息
const osInfo = client.query('SELECT Caption, Version FROM Win32_OperatingSystem');
const result = JSON.parse(osInfo);
console.log(result);

// 查询进程信息
const processes = client.query('SELECT ProcessId, Name FROM Win32_Process WHERE Name = "explorer.exe"');
console.log(JSON.parse(processes));
```

### 快速查询

```javascript
const { quickQuery } = require('./index.js');

// 使用默认命名空间
const result1 = quickQuery('SELECT * FROM Win32_ComputerSystem');

// 指定命名空间
const result2 = quickQuery('SELECT * FROM Msvm_ComputerSystem', 'root/virtualization/v2');
```

## API 参考

### WmiClient 类

#### 构造函数
```javascript
new WmiClient(config?)
```
- `config.namespace`: 字符串，WMI命名空间路径，默认 `'root/cimv2'`
- `config.timeout`: 数字，查询超时时间（毫秒），预留字段

#### 方法

##### query(wql)
执行 WQL 查询并返回 JSON 字符串。
- `wql`: 字符串，WQL 查询语句
- 返回: JSON 字符串，包含查询结果

##### getNamespace()
获取当前连接的命名空间。
- 返回: 字符串，命名空间路径

##### testConnection()
测试 WMI 连接是否正常。
- 返回: 布尔值，连接状态

### 快速查询函数

#### quickQuery(wql, namespace?)
执行快速查询，无需创建客户端实例。
- `wql`: 字符串，WQL 查询语句
- `namespace`: 字符串，可选，命名空间路径
- 返回: JSON 字符串，查询结果

## 常用命名空间

- `root/cimv2` - 默认命名空间，包含系统信息
- `root/virtualization/v2` - Hyper-V 虚拟化信息
- `root/wmi` - Windows 管理工具
- `root/directory/ldap` - Active Directory 信息

## 示例查询

### 系统信息
```javascript
// 操作系统
client.query('SELECT * FROM Win32_OperatingSystem');

// 处理器
client.query('SELECT * FROM Win32_Processor');

// 内存
client.query('SELECT * FROM Win32_PhysicalMemory');

// 磁盘
client.query('SELECT * FROM Win32_LogicalDisk');
```

### 进程和服务
```javascript
// 所有进程
client.query('SELECT ProcessId, Name FROM Win32_Process');

// 运行中的服务
client.query('SELECT Name, State FROM Win32_Service WHERE State = "Running"');
```

### Hyper-V 虚拟机
```javascript
const hypervClient = new WmiClient({ namespace: 'root/virtualization/v2' });
hypervClient.query('SELECT ElementName, EnabledState FROM Msvm_ComputerSystem WHERE Caption = "Virtual Machine"');
```

## 注意事项

1. 部分命名空间需要管理员权限
2. 查询结果直接返回 JSON 字符串，需要使用 `JSON.parse()` 解析
3. 长时间运行的查询可能会超时
4. WQL 语法与 SQL 类似但有所差异

## 与原版差异

简化版移除了以下功能：
- 预定义的便捷查询方法
- 事件日志查询的结果限制功能
- 复杂的错误处理

保留核心功能：
- 原始 WQL 查询能力
- 命名空间支持
- JSON 格式输出

## 许可证

MIT OR Apache-2.0 