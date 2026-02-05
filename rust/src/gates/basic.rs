//! Basic logic gate implementations

use super::gate::{Gate, GateResult};
use super::state::StateType;

/// AND Gate
pub struct AndGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl AndGate {
    pub fn new(id: String, input_count: usize, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; input_count],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for AndGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "AND" }
    fn input_count(&self) -> usize { self.inputs.len() }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let mut result = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        for &input in self.inputs.iter().skip(1) {
            result = result.and(input);
        }
        self.outputs[0] = result;
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// OR Gate
pub struct OrGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl OrGate {
    pub fn new(id: String, input_count: usize, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; input_count],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for OrGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "OR" }
    fn input_count(&self) -> usize { self.inputs.len() }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let mut result = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        for &input in self.inputs.iter().skip(1) {
            result = result.or(input);
        }
        self.outputs[0] = result;
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// NOT Gate (Inverter)
pub struct NotGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl NotGate {
    pub fn new(id: String, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; 1],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for NotGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "NOT" }
    fn input_count(&self) -> usize { 1 }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let input = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        self.outputs[0] = input.not();
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// XOR Gate
pub struct XorGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl XorGate {
    pub fn new(id: String, input_count: usize, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; input_count],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for XorGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "XOR" }
    fn input_count(&self) -> usize { self.inputs.len() }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let mut result = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        for &input in self.inputs.iter().skip(1) {
            result = result.xor(input);
        }
        self.outputs[0] = result;
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// NAND Gate (AND + NOT)
pub struct NandGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl NandGate {
    pub fn new(id: String, input_count: usize, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; input_count],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for NandGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "NAND" }
    fn input_count(&self) -> usize { self.inputs.len() }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let mut result = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        for &input in self.inputs.iter().skip(1) {
            result = result.and(input);
        }
        self.outputs[0] = result.not();
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// NOR Gate (OR + NOT)
pub struct NorGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl NorGate {
    pub fn new(id: String, input_count: usize, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; input_count],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for NorGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "NOR" }
    fn input_count(&self) -> usize { self.inputs.len() }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let mut result = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        for &input in self.inputs.iter().skip(1) {
            result = result.or(input);
        }
        self.outputs[0] = result.not();
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// XNOR Gate (XOR + NOT)
pub struct XnorGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl XnorGate {
    pub fn new(id: String, input_count: usize, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; input_count],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for XnorGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "XNOR" }
    fn input_count(&self) -> usize { self.inputs.len() }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let mut result = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        for &input in self.inputs.iter().skip(1) {
            result = result.xor(input);
        }
        self.outputs[0] = result.not();
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// Buffer Gate (pass through)
pub struct BufferGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl BufferGate {
    pub fn new(id: String, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; 1],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for BufferGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "BUFFER" }
    fn input_count(&self) -> usize { 1 }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        self.outputs[0] = self.inputs.first().copied().unwrap_or(StateType::Unknown);
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// Tri-state Buffer (input 0 = data, input 1 = enable)
pub struct TriBufferGate {
    id: String,
    inputs: Vec<StateType>,
    outputs: Vec<StateType>,
    delay: u64,
}

impl TriBufferGate {
    pub fn new(id: String, delay: u64) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; 2],
            outputs: vec![StateType::Unknown; 1],
            delay,
        }
    }
}

impl Gate for TriBufferGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "TRI_BUFFER" }
    fn input_count(&self) -> usize { 2 }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        let data = self.inputs[0];
        let enable = self.inputs[1];
        self.outputs[0] = match enable {
            StateType::One => data,
            StateType::Zero => StateType::HiZ,
            _ => StateType::Unknown,
        };
        GateResult { outputs: self.outputs.clone(), delay: self.delay }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
        self.outputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { self.delay }
}

/// Toggle Switch (User input)
pub struct ToggleGate {
    id: String,
    outputs: Vec<StateType>,
    state: StateType,
}

impl ToggleGate {
    pub fn new(id: String) -> Self {
        Self {
            id,
            outputs: vec![StateType::Zero; 1],
            state: StateType::Zero,
        }
    }
}

impl Gate for ToggleGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "TOGGLE" }
    fn input_count(&self) -> usize { 0 }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &[] }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }
    fn set_input(&mut self, _index: usize, _state: StateType) {}

    fn evaluate(&mut self) -> GateResult {
        self.outputs[0] = self.state;
        GateResult { outputs: self.outputs.clone(), delay: 0 }
    }

    fn reset(&mut self) {
        self.state = StateType::Zero;
        self.outputs[0] = StateType::Zero;
    }

    fn delay(&self) -> u64 { 0 }

    fn toggle(&mut self) {
        self.state = if self.state == StateType::Zero {
            StateType::One
        } else {
            StateType::Zero
        };
    }
}

/// Clock source (oscillates between ZERO and ONE)
pub struct ClockGate {
    id: String,
    outputs: Vec<StateType>,
    period: u64,
    state: StateType,
}

impl ClockGate {
    pub fn new(id: String) -> Self {
        Self {
            id,
            outputs: vec![StateType::Zero; 1],
            period: 10,
            state: StateType::Zero,
        }
    }

    pub fn tick(&mut self, time: u64) -> StateType {
        let new_state = if (time / self.period) % 2 == 0 {
            StateType::Zero
        } else {
            StateType::One
        };
        self.state = new_state;
        self.outputs[0] = new_state;
        new_state
    }
}

impl Gate for ClockGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "CLOCK" }
    fn input_count(&self) -> usize { 0 }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &[] }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }
    fn set_input(&mut self, _index: usize, _state: StateType) {}

    fn evaluate(&mut self) -> GateResult {
        self.outputs[0] = self.state;
        GateResult { outputs: self.outputs.clone(), delay: 0 }
    }

    fn reset(&mut self) {
        self.state = StateType::Zero;
        self.outputs[0] = StateType::Zero;
    }

    fn delay(&self) -> u64 { 0 }
}

/// Pulse button (momentary HIGH)
pub struct PulseGate {
    id: String,
    outputs: Vec<StateType>,
    active: bool,
    pulse_end_time: u64,
}

impl PulseGate {
    pub fn new(id: String) -> Self {
        Self {
            id,
            outputs: vec![StateType::Zero; 1],
            active: false,
            pulse_end_time: 0,
        }
    }
}

impl Gate for PulseGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "PULSE" }
    fn input_count(&self) -> usize { 0 }
    fn output_count(&self) -> usize { 1 }
    fn get_inputs(&self) -> &[StateType] { &[] }
    fn get_outputs(&self) -> &[StateType] { &self.outputs }
    fn set_input(&mut self, _index: usize, _state: StateType) {}

    fn evaluate(&mut self) -> GateResult {
        self.outputs[0] = if self.active { StateType::One } else { StateType::Zero };
        GateResult { outputs: self.outputs.clone(), delay: 0 }
    }

    fn reset(&mut self) {
        self.active = false;
        self.outputs[0] = StateType::Zero;
    }

    fn delay(&self) -> u64 { 0 }
}

/// LED Output
pub struct LedGate {
    id: String,
    inputs: Vec<StateType>,
}

impl LedGate {
    pub fn new(id: String) -> Self {
        Self {
            id,
            inputs: vec![StateType::Unknown; 1],
        }
    }
}

impl Gate for LedGate {
    fn id(&self) -> &str { &self.id }
    fn gate_type(&self) -> &str { "LED" }
    fn input_count(&self) -> usize { 1 }
    fn output_count(&self) -> usize { 0 }
    fn get_inputs(&self) -> &[StateType] { &self.inputs }
    fn get_outputs(&self) -> &[StateType] { &[] }

    fn set_input(&mut self, index: usize, state: StateType) {
        if index < self.inputs.len() { self.inputs[index] = state; }
    }

    fn evaluate(&mut self) -> GateResult {
        GateResult { outputs: vec![], delay: 0 }
    }

    fn reset(&mut self) {
        self.inputs.fill(StateType::Unknown);
    }

    fn delay(&self) -> u64 { 0 }
}

/// Factory function to create gates by type
pub fn create_gate(gate_type: &str, id: String, input_count: Option<usize>) -> Box<dyn Gate> {
    match gate_type {
        "AND" => Box::new(AndGate::new(id, input_count.unwrap_or(2), 1)),
        "OR" => Box::new(OrGate::new(id, input_count.unwrap_or(2), 1)),
        "NOT" => Box::new(NotGate::new(id, 1)),
        "XOR" => Box::new(XorGate::new(id, input_count.unwrap_or(2), 1)),
        "NAND" => Box::new(NandGate::new(id, input_count.unwrap_or(2), 1)),
        "NOR" => Box::new(NorGate::new(id, input_count.unwrap_or(2), 1)),
        "XNOR" => Box::new(XnorGate::new(id, input_count.unwrap_or(2), 1)),
        "BUFFER" => Box::new(BufferGate::new(id, 1)),
        "TRI_BUFFER" => Box::new(TriBufferGate::new(id, 1)),
        "TOGGLE" => Box::new(ToggleGate::new(id)),
        "CLOCK" => Box::new(ClockGate::new(id)),
        "PULSE" => Box::new(PulseGate::new(id)),
        "LED" => Box::new(LedGate::new(id)),
        _ => Box::new(BufferGate::new(id, 1)), // Default fallback
    }
}
