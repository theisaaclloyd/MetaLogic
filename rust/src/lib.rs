//! MetaLogic WASM Simulation Core
//!
//! High-performance digital logic simulation engine compiled to WebAssembly.

mod simulation;
mod gates;

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use simulation::engine::SimulationEngine;

/// Gate state representation for JS interop
#[derive(Serialize, Deserialize)]
pub struct GateState {
    pub id: String,
    #[serde(rename = "type")]
    pub gate_type: String,
    pub input_states: Vec<u8>,
    pub output_states: Vec<u8>,
}

/// Wire state representation for JS interop
#[derive(Serialize, Deserialize)]
pub struct WireState {
    pub id: String,
    pub state: u8,
    pub source_gate_id: String,
    pub source_port_index: u32,
    pub target_gate_id: String,
    pub target_port_index: u32,
}

/// Simulation snapshot for JS interop
#[derive(Serialize, Deserialize)]
pub struct SimulationSnapshot {
    pub time: u64,
    pub gates: Vec<GateState>,
    pub wires: Vec<WireState>,
}

/// WASM-exposed simulation engine wrapper
#[wasm_bindgen]
pub struct WasmSimulation {
    engine: SimulationEngine,
}

#[wasm_bindgen]
impl WasmSimulation {
    /// Create a new simulation instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        WasmSimulation {
            engine: SimulationEngine::new(),
        }
    }

    /// Initialize simulation with gates and wires
    #[wasm_bindgen]
    pub fn initialize(&mut self, gates_js: JsValue, wires_js: JsValue) -> Result<(), JsValue> {
        let gates: Vec<GateState> = serde_wasm_bindgen::from_value(gates_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse gates: {}", e)))?;
        let wires: Vec<WireState> = serde_wasm_bindgen::from_value(wires_js)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse wires: {}", e)))?;

        self.engine.initialize(gates, wires);
        Ok(())
    }

    /// Run a single simulation step
    #[wasm_bindgen]
    pub fn step(&mut self, count: u32) {
        for _ in 0..count {
            self.engine.step();
        }
    }

    /// Start continuous simulation
    #[wasm_bindgen]
    pub fn run(&mut self) {
        self.engine.set_running(true);
    }

    /// Pause simulation
    #[wasm_bindgen]
    pub fn pause(&mut self) {
        self.engine.set_running(false);
    }

    /// Reset simulation to initial state
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.engine.reset();
    }

    /// Toggle an input gate
    #[wasm_bindgen]
    pub fn toggle_input(&mut self, gate_id: &str) {
        self.engine.toggle_input(gate_id);
    }

    /// Get current simulation state as JSON
    #[wasm_bindgen]
    pub fn get_state(&self) -> Result<JsValue, JsValue> {
        let snapshot = self.engine.get_snapshot();
        serde_wasm_bindgen::to_value(&snapshot)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize state: {}", e)))
    }

    /// Get current simulation time
    #[wasm_bindgen]
    pub fn get_time(&self) -> u64 {
        self.engine.get_current_time()
    }

    /// Check if simulation is running
    #[wasm_bindgen]
    pub fn is_running(&self) -> bool {
        self.engine.is_running()
    }
}

impl Default for WasmSimulation {
    fn default() -> Self {
        Self::new()
    }
}
