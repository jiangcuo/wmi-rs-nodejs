use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde_json::Value;
use std::collections::HashMap;
use wmi::{COMLibrary, WMIConnection, Variant};

// 将WMI Variant转换为JSON Value
fn variant_to_json(variant: &Variant) -> Value {
    match variant {
        Variant::Empty => Value::Null,
        Variant::Null => Value::Null,
        Variant::String(s) => Value::String(s.clone()),
        Variant::I1(i) => Value::Number((*i as i64).into()),
        Variant::I2(i) => Value::Number((*i as i64).into()),
        Variant::I4(i) => Value::Number((*i as i64).into()),
        Variant::I8(i) => Value::Number((*i).into()),
        Variant::UI1(i) => Value::Number((*i as u64).into()),
        Variant::UI2(i) => Value::Number((*i as u64).into()),
        Variant::UI4(i) => Value::Number((*i as u64).into()),
        Variant::UI8(i) => Value::Number((*i).into()),
        Variant::R4(f) => Value::Number(serde_json::Number::from_f64(*f as f64).unwrap_or_else(|| 0.into())),
        Variant::R8(f) => Value::Number(serde_json::Number::from_f64(*f).unwrap_or_else(|| 0.into())),
        Variant::Bool(b) => Value::Bool(*b),
        Variant::Array(arr) => {
            let values: Vec<Value> = arr.iter().map(variant_to_json).collect();
            Value::Array(values)
        }
        _ => Value::String(format!("{:?}", variant)),
    }
}

// WMI客户端配置
#[napi(object)]
#[derive(Debug)]
pub struct WmiClientConfig {
    pub namespace: Option<String>,
    pub timeout: Option<u32>,
}

// WMI客户端
#[napi]
pub struct WmiClient {
    inner: WMIConnection,
    namespace: String,
}

#[napi]
impl WmiClient {
    /// 创建新的WMI客户端
    #[napi(constructor)]
    pub fn new(config: Option<WmiClientConfig>) -> Result<Self> {
        let namespace = config
            .as_ref()
            .and_then(|c| c.namespace.clone())
            .unwrap_or_else(|| "root/cimv2".to_string());

        let com_lib = COMLibrary::new()
            .map_err(|e| Error::new(Status::GenericFailure, format!("初始化COM失败: {}", e)))?;
        
        let wmi_con = WMIConnection::with_namespace_path(&namespace, com_lib)
            .map_err(|e| Error::new(Status::GenericFailure, format!("创建WMI连接失败: {}", e)))?;

        Ok(WmiClient { 
            inner: wmi_con,
            namespace,
        })
    }

    /// 执行WQL查询，返回JSON字符串
    #[napi]
    pub fn query(&self, wql: String) -> Result<String> {
        let results: Vec<HashMap<String, Variant>> = self.inner
            .raw_query(&wql)
            .map_err(|e| Error::new(Status::GenericFailure, format!("查询失败: {}", e)))?;

        let json_results: Vec<Value> = results
            .into_iter()
            .map(|row| {
                let json_row: HashMap<String, Value> = row
                    .into_iter()
                    .map(|(k, v)| (k, variant_to_json(&v)))
                    .collect();
                Value::Object(json_row.into_iter().collect())
            })
            .collect();

        serde_json::to_string(&json_results)
            .map_err(|e| Error::new(Status::GenericFailure, format!("JSON序列化失败: {}", e)))
    }

    /// 获取当前命名空间
    #[napi]
    pub fn get_namespace(&self) -> String {
        self.namespace.clone()
    }

    /// 测试连接是否正常
    #[napi]
    pub fn test_connection(&self) -> Result<bool> {
        match self.query("SELECT * FROM __Namespace WHERE Name = 'default'".to_string()) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }
}

/// 快速查询函数，使用默认命名空间
#[napi]
pub fn quick_query(wql: String, namespace: Option<String>) -> Result<String> {
    let config = WmiClientConfig {
        namespace,
        timeout: None,
    };
    
    let client = WmiClient::new(Some(config))?;
    client.query(wql)
}

/// 获取当前系统的基本信息
#[napi]
pub fn get_system_info() -> Result<String> {
    let com_lib = COMLibrary::new()
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to initialize COM: {}", e)))?;
    
    let wmi_con = WMIConnection::new(com_lib)
        .map_err(|e| Error::new(Status::GenericFailure, format!("Failed to create WMI connection: {}", e)))?;

    let results: Vec<HashMap<String, Variant>> = wmi_con
        .raw_query("SELECT * FROM Win32_ComputerSystem")
        .map_err(|e| Error::new(Status::GenericFailure, format!("Query failed: {}", e)))?;

    let json_results: Vec<Value> = results
        .into_iter()
        .map(|row| {
            let json_row: HashMap<String, Value> = row
                .into_iter()
                .map(|(k, v)| (k, variant_to_json(&v)))
                .collect();
            Value::Object(json_row.into_iter().collect())
        })
        .collect();

    serde_json::to_string(&json_results)
        .map_err(|e| Error::new(Status::GenericFailure, format!("JSON serialization failed: {}", e)))
} 