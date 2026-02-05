//! 5-state logic types for digital simulation

use serde::{Deserialize, Serialize};

/// Logic state type (5-state)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u8)]
pub enum StateType {
    Zero = 0,
    One = 1,
    HiZ = 2,
    Conflict = 3,
    Unknown = 4,
}

impl StateType {
    /// Convert from u8
    pub fn from_u8(value: u8) -> Self {
        match value {
            0 => StateType::Zero,
            1 => StateType::One,
            2 => StateType::HiZ,
            3 => StateType::Conflict,
            4 => StateType::Unknown,
            _ => StateType::Unknown,
        }
    }

    /// Convert to u8
    pub fn to_u8(self) -> u8 {
        self as u8
    }

    /// Logical NOT operation
    pub fn not(self) -> Self {
        match self {
            StateType::Zero => StateType::One,
            StateType::One => StateType::Zero,
            StateType::HiZ => StateType::Unknown,
            StateType::Conflict => StateType::Conflict,
            StateType::Unknown => StateType::Unknown,
        }
    }

    /// Logical AND operation
    pub fn and(self, other: Self) -> Self {
        if self == StateType::Zero || other == StateType::Zero {
            return StateType::Zero;
        }
        if self == StateType::Conflict || other == StateType::Conflict {
            return StateType::Conflict;
        }
        if self == StateType::Unknown || other == StateType::Unknown {
            return StateType::Unknown;
        }
        if self == StateType::HiZ || other == StateType::HiZ {
            return StateType::Unknown;
        }
        StateType::One
    }

    /// Logical OR operation
    pub fn or(self, other: Self) -> Self {
        if self == StateType::One || other == StateType::One {
            return StateType::One;
        }
        if self == StateType::Conflict || other == StateType::Conflict {
            return StateType::Conflict;
        }
        if self == StateType::Unknown || other == StateType::Unknown {
            return StateType::Unknown;
        }
        if self == StateType::HiZ || other == StateType::HiZ {
            return StateType::Unknown;
        }
        StateType::Zero
    }

    /// Logical XOR operation
    pub fn xor(self, other: Self) -> Self {
        if self == StateType::Conflict || other == StateType::Conflict {
            return StateType::Conflict;
        }
        if self == StateType::Unknown || other == StateType::Unknown {
            return StateType::Unknown;
        }
        if self == StateType::HiZ || other == StateType::HiZ {
            return StateType::Unknown;
        }
        if self == other {
            StateType::Zero
        } else {
            StateType::One
        }
    }
}

impl Default for StateType {
    fn default() -> Self {
        StateType::Unknown
    }
}

/// Resolve wire state from multiple sources
pub fn resolve_wire_state(sources: &[StateType]) -> StateType {
    if sources.is_empty() {
        return StateType::HiZ;
    }

    let mut has_zero = false;
    let mut has_one = false;
    let mut has_unknown = false;

    for &state in sources {
        match state {
            StateType::Conflict => return StateType::Conflict,
            StateType::Zero => has_zero = true,
            StateType::One => has_one = true,
            StateType::Unknown => has_unknown = true,
            StateType::HiZ => {} // HiZ doesn't drive the wire
        }
    }

    if has_zero && has_one {
        StateType::Conflict
    } else if has_one {
        StateType::One
    } else if has_zero {
        StateType::Zero
    } else if has_unknown {
        StateType::Unknown
    } else {
        StateType::HiZ
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_not() {
        assert_eq!(StateType::Zero.not(), StateType::One);
        assert_eq!(StateType::One.not(), StateType::Zero);
        assert_eq!(StateType::HiZ.not(), StateType::Unknown);
    }

    #[test]
    fn test_and() {
        assert_eq!(StateType::Zero.and(StateType::Zero), StateType::Zero);
        assert_eq!(StateType::Zero.and(StateType::One), StateType::Zero);
        assert_eq!(StateType::One.and(StateType::One), StateType::One);
    }

    #[test]
    fn test_wire_resolution() {
        assert_eq!(resolve_wire_state(&[]), StateType::HiZ);
        assert_eq!(resolve_wire_state(&[StateType::HiZ]), StateType::HiZ);
        assert_eq!(resolve_wire_state(&[StateType::One]), StateType::One);
        assert_eq!(resolve_wire_state(&[StateType::Zero, StateType::One]), StateType::Conflict);
    }
}
