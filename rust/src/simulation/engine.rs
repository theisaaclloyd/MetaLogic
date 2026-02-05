//! Core simulation engine

use std::collections::HashMap;

use crate::gates::basic::create_gate;
use crate::gates::gate::Gate;
use crate::gates::state::{resolve_wire_state, StateType};
use crate::{GateState, SimulationSnapshot, WireState};

use super::event_queue::EventQueue;

/// Wire representation
struct Wire {
    id: String,
    state: StateType,
    source_gate_id: String,
    source_port_index: u32,
    target_gate_id: String,
    target_port_index: u32,
}

/// Core simulation engine
pub struct SimulationEngine {
    gates: HashMap<String, Box<dyn Gate>>,
    wires: HashMap<String, Wire>,
    event_queue: EventQueue,
    current_time: u64,
    running: bool,
}

impl SimulationEngine {
    pub fn new() -> Self {
        Self {
            gates: HashMap::new(),
            wires: HashMap::new(),
            event_queue: EventQueue::new(),
            current_time: 0,
            running: false,
        }
    }

    /// Initialize the simulation with gates and wires
    pub fn initialize(&mut self, gates: Vec<GateState>, wires: Vec<WireState>) {
        self.gates.clear();
        self.wires.clear();
        self.event_queue.clear();
        self.current_time = 0;

        // Create gate instances
        for gate_state in gates {
            let input_count = if gate_state.input_states.is_empty() {
                None
            } else {
                Some(gate_state.input_states.len())
            };

            let gate = create_gate(&gate_state.gate_type, gate_state.id.clone(), input_count);
            self.gates.insert(gate_state.id, gate);
        }

        // Create wire connections
        for wire_state in wires {
            let wire = Wire {
                id: wire_state.id.clone(),
                state: StateType::from_u8(wire_state.state),
                source_gate_id: wire_state.source_gate_id,
                source_port_index: wire_state.source_port_index,
                target_gate_id: wire_state.target_gate_id,
                target_port_index: wire_state.target_port_index,
            };
            self.wires.insert(wire_state.id, wire);
        }

        // Schedule initial evaluation for all gates
        // Collect keys first to avoid borrow conflict
        let gate_ids: Vec<String> = self.gates.keys().cloned().collect();
        for gate_id in gate_ids {
            self.schedule_gate_evaluation(gate_id, 0);
        }
    }

    /// Schedule a gate for evaluation
    fn schedule_gate_evaluation(&mut self, gate_id: String, time: u64) {
        self.event_queue
            .push(time, gate_id, -1, StateType::Unknown);
    }

    /// Propagate wire state to target gate
    fn propagate_wire_state(&mut self, wire_id: &str, new_state: StateType) {
        let wire = match self.wires.get_mut(wire_id) {
            Some(w) => w,
            None => return,
        };

        if wire.state == new_state {
            return;
        }

        wire.state = new_state;
        let target_gate_id = wire.target_gate_id.clone();
        let target_port_index = wire.target_port_index;

        // Collect all inputs to the target port
        let input_states: Vec<StateType> = self
            .wires
            .values()
            .filter(|w| w.target_gate_id == target_gate_id && w.target_port_index == target_port_index)
            .map(|w| w.state)
            .collect();

        let resolved_state = resolve_wire_state(&input_states);

        // Update target gate input
        if let Some(gate) = self.gates.get_mut(&target_gate_id) {
            gate.set_input(target_port_index as usize, resolved_state);
        }

        // Schedule target gate evaluation
        self.schedule_gate_evaluation(target_gate_id, self.current_time + 1);
    }

    /// Process a single simulation step
    pub fn step(&mut self) {
        let max_events = 10000;
        let mut events_processed = 0;

        while !self.event_queue.is_empty() && events_processed < max_events {
            let event = match self.event_queue.peek() {
                Some(e) if e.time <= self.current_time => self.event_queue.pop().unwrap(),
                _ => break,
            };

            events_processed += 1;

            let gate = match self.gates.get_mut(&event.gate_id) {
                Some(g) => g,
                None => continue,
            };

            // Store previous outputs
            let previous_outputs: Vec<StateType> = gate.get_outputs().to_vec();

            // Evaluate gate
            let result = gate.evaluate();

            // Check for output changes and propagate
            for (i, &new_state) in result.outputs.iter().enumerate() {
                let old_state = previous_outputs.get(i).copied().unwrap_or(StateType::Unknown);

                if old_state != new_state {
                    // Propagate to connected wires
                    let gate_id = event.gate_id.clone();
                    let wire_ids: Vec<String> = self
                        .wires
                        .iter()
                        .filter(|(_, w)| w.source_gate_id == gate_id && w.source_port_index == i as u32)
                        .map(|(id, _)| id.clone())
                        .collect();

                    for wire_id in wire_ids {
                        self.propagate_wire_state(&wire_id, new_state);
                    }
                }
            }
        }

        // Advance time
        if let Some(next_event) = self.event_queue.peek() {
            self.current_time = self.current_time.max(next_event.time);
        }
        self.current_time += 1;
    }

    /// Toggle an input gate
    pub fn toggle_input(&mut self, gate_id: &str) {
        if let Some(gate) = self.gates.get_mut(gate_id) {
            gate.toggle();
        }
        self.schedule_gate_evaluation(gate_id.to_string(), self.current_time);
    }

    /// Set running state
    pub fn set_running(&mut self, running: bool) {
        self.running = running;
    }

    /// Check if simulation is running
    pub fn is_running(&self) -> bool {
        self.running
    }

    /// Get current simulation time
    pub fn get_current_time(&self) -> u64 {
        self.current_time
    }

    /// Reset simulation
    pub fn reset(&mut self) {
        self.current_time = 0;
        self.event_queue.clear();

        for gate in self.gates.values_mut() {
            gate.reset();
        }

        for wire in self.wires.values_mut() {
            wire.state = StateType::Unknown;
        }

        let gate_ids: Vec<String> = self.gates.keys().cloned().collect();
        for gate_id in gate_ids {
            self.schedule_gate_evaluation(gate_id, 0);
        }
    }

    /// Get current state snapshot
    pub fn get_snapshot(&self) -> SimulationSnapshot {
        let gates: Vec<GateState> = self
            .gates
            .iter()
            .map(|(id, gate)| GateState {
                id: id.clone(),
                gate_type: gate.gate_type().to_string(),
                input_states: gate.get_inputs().iter().map(|s| s.to_u8()).collect(),
                output_states: gate.get_outputs().iter().map(|s| s.to_u8()).collect(),
            })
            .collect();

        let wires: Vec<WireState> = self
            .wires
            .iter()
            .map(|(id, wire)| WireState {
                id: id.clone(),
                state: wire.state.to_u8(),
                source_gate_id: wire.source_gate_id.clone(),
                source_port_index: wire.source_port_index,
                target_gate_id: wire.target_gate_id.clone(),
                target_port_index: wire.target_port_index,
            })
            .collect();

        SimulationSnapshot {
            time: self.current_time,
            gates,
            wires,
        }
    }
}

impl Default for SimulationEngine {
    fn default() -> Self {
        Self::new()
    }
}
