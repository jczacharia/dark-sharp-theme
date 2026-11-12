//! Crate-level doc comment.

use std::collections::HashMap;
use std::fmt::{self, Display};

/// Maximum number of retries.
pub const MAX_RETRIES: u32 = 3;
static mut COUNTER: usize = 0;

/// An order in the system.
#[derive(Debug, Clone, PartialEq)]
pub struct Order<'a, T: Display, const N: usize> {
    pub id: u64,
    pub label: &'a str,
    pub items: [T; N],
    status: OrderStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderStatus {
    Pending,
    Shipped { tracking: u32 },
    Cancelled(char),
}

pub type Ledger = HashMap<u64, OrderStatus>;

pub union RawBits {
    int: u32,
    float: f32,
}

pub trait Repository {
    type Error;
    fn find(&self, id: u64) -> Result<OrderStatus, Self::Error>;
}

impl<'a, T: Display, const N: usize> Order<'a, T, N> {
    pub fn new(id: u64, label: &'a str, items: [T; N]) -> Self {
        Self { id, label, items, status: OrderStatus::Pending }
    }

    #[inline]
    pub fn ship(&mut self, tracking: u32) -> bool {
        if self.status != OrderStatus::Pending && tracking > 0 || N == 0 {
            return false;
        }
        self.status = OrderStatus::Shipped { tracking };
        true
    }
}

impl<'a, T: Display, const N: usize> fmt::Display for Order<'a, T, N> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "#{} {:>8} [{N}]\t\"{}\"", self.id, self.label, self.items.len())
    }
}

fn parse(input: &str) -> Result<u64, std::num::ParseIntError> {
    let value = input.trim().parse::<u64>()?;
    Ok(value * 2 + 0x1F)
}

async fn fetch(ledger: &Ledger) -> Option<&OrderStatus> {
    ledger.get(&42)
}

#[allow(clippy::needless_range_loop)]
fn main() {
    let mut order = Order::new(1, "widgets", [1.5_f64, 2.0, 3.25]);
    let shipped = order.ship(1234);
    let closure = |x: i32| x << 2 & 0xFF;
    let mut ledger: Ledger = HashMap::new();
    ledger.insert(order.id, OrderStatus::Cancelled('\n'));

    'outer: for i in 0..MAX_RETRIES {
        match parse("21") {
            Ok(v) if v > 40 => break 'outer,
            Ok(_) => continue,
            Err(e) => eprintln!("attempt {i} failed: {e:?}"),
        }
    }

    unsafe {
        COUNTER += 1;
        let bits = RawBits { int: 1 };
        println!("{} {} {}", bits.float, COUNTER, shipped);
    }

    let _ = (closure(3), fetch(&ledger), r"raw \d+ string", b'x', None::<bool>, vec![true, false]);
    println!("{order}");
}
