//! Gate trait and common functionality

use super::state::StateType;

/// Gate evaluation result
pub struct GateResult {
    pub outputs: Vec<StateType>,
    pub delay: u64,
}

/// Trait for all logic gates
pub trait Gate {
    /// Get gate ID
    fn id(&self) -> &str;

    /// Get gate type name
    fn gate_type(&self) -> &str;

    /// Get number of inputs
    fn input_count(&self) -> usize;

    /// Get number of outputs
    fn output_count(&self) -> usize;

    /// Get current input states
    fn get_inputs(&self) -> &[StateType];

    /// Get current output states
    fn get_outputs(&self) -> &[StateType];

    /// Set input state at index
    fn set_input(&mut self, index: usize, state: StateType);

    /// Evaluate gate logic and return outputs
    fn evaluate(&mut self) -> GateResult;

    /// Reset gate to initial state
    fn reset(&mut self);

    /// Get propagation delay
    fn delay(&self) -> u64 {
        1
    }

    /// Check for rising edge on input (for sequential logic)
    fn is_rising_edge(&self, _index: usize) -> bool {
        false
    }

    /// Update previous inputs for edge detection
    fn update_previous_inputs(&mut self) {}

    /// Toggle gate state (for interactive gates like switches)
    fn toggle(&mut self) {}
}
