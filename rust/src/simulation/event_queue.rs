//! Priority queue for simulation events

use std::cmp::Ordering;
use std::collections::BinaryHeap;

use crate::gates::state::StateType;

/// Simulation event
#[derive(Clone, Eq, PartialEq)]
pub struct SimulationEvent {
    pub time: u64,
    pub creation_time: u64, // For deterministic ordering
    pub gate_id: String,
    pub port_index: i32, // -1 for full gate evaluation
    pub new_state: StateType,
}

impl Ord for SimulationEvent {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse ordering for min-heap behavior
        other.time.cmp(&self.time)
            .then_with(|| other.creation_time.cmp(&self.creation_time))
    }
}

impl PartialOrd for SimulationEvent {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Event queue using a binary heap
pub struct EventQueue {
    heap: BinaryHeap<SimulationEvent>,
    creation_counter: u64,
}

impl EventQueue {
    pub fn new() -> Self {
        Self {
            heap: BinaryHeap::new(),
            creation_counter: 0,
        }
    }

    /// Add an event to the queue
    pub fn push(&mut self, time: u64, gate_id: String, port_index: i32, new_state: StateType) {
        let event = SimulationEvent {
            time,
            creation_time: self.creation_counter,
            gate_id,
            port_index,
            new_state,
        };
        self.creation_counter += 1;
        self.heap.push(event);
    }

    /// Remove and return the earliest event
    pub fn pop(&mut self) -> Option<SimulationEvent> {
        self.heap.pop()
    }

    /// Look at the earliest event without removing it
    pub fn peek(&self) -> Option<&SimulationEvent> {
        self.heap.peek()
    }

    /// Check if queue is empty
    pub fn is_empty(&self) -> bool {
        self.heap.is_empty()
    }

    /// Get number of events in queue
    pub fn len(&self) -> usize {
        self.heap.len()
    }

    /// Clear all events
    pub fn clear(&mut self) {
        self.heap.clear();
        self.creation_counter = 0;
    }

    /// Remove all events for a specific gate
    pub fn remove_events_for_gate(&mut self, gate_id: &str) {
        let filtered: Vec<_> = self.heap.drain().filter(|e| e.gate_id != gate_id).collect();
        for event in filtered {
            self.heap.push(event);
        }
    }
}

impl Default for EventQueue {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_ordering() {
        let mut queue = EventQueue::new();

        queue.push(10, "gate1".to_string(), 0, StateType::One);
        queue.push(5, "gate2".to_string(), 0, StateType::Zero);
        queue.push(15, "gate3".to_string(), 0, StateType::One);

        assert_eq!(queue.pop().unwrap().time, 5);
        assert_eq!(queue.pop().unwrap().time, 10);
        assert_eq!(queue.pop().unwrap().time, 15);
    }

    #[test]
    fn test_same_time_ordering() {
        let mut queue = EventQueue::new();

        queue.push(10, "gate1".to_string(), 0, StateType::One);
        queue.push(10, "gate2".to_string(), 0, StateType::Zero);
        queue.push(10, "gate3".to_string(), 0, StateType::One);

        // Should come out in creation order
        assert_eq!(queue.pop().unwrap().gate_id, "gate1");
        assert_eq!(queue.pop().unwrap().gate_id, "gate2");
        assert_eq!(queue.pop().unwrap().gate_id, "gate3");
    }
}
