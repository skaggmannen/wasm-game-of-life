mod utils;

use std::fmt;
use wasm_bindgen::prelude::*;
use js_sys::Math;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

#[wasm_bindgen]
impl Cell {
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        }
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
impl Universe {
    pub fn new(width: u32, height: u32) -> Universe {
        utils::set_panic_hook();

        let mut universe = Universe{
            width: width,
            height: height,
            cells: (0..width*height)
                        .map(|_| Universe::initial_cell())
                        .collect(),
        };

        universe.set_cells(SPACESHIP);

        universe
    }

    pub fn new_empty(width: u32, height: u32) -> Universe {
        utils::set_panic_hook();
        
        Universe{
            width: width,
            height: height,
            cells: (0..width*height)
                        .map(|_| Cell::Dead)
                        .collect(),
        }
    }

    pub fn render(&self) -> String {
        self.to_string()
    }

    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let cell = self.cells[self.index(row, col)];

                let next_cell = match ( cell, self.live_neighbors(row, col) ) {
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    (Cell::Dead, 3) => Cell::Alive,
                    (otherwise, _) => otherwise,
                };

                next[self.index(row, col)] = next_cell;
            }
        }

        self.cells = next;
    }

    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        let idx = self.index(row, col);
        self.cells[idx].toggle();
    }

}

static SPACESHIP: &'static [(u32, u32)] = &[
    (1, 2), 
    (2, 3), 
    (3, 1), (3, 2), (3, 3)
];

impl Universe {
    fn initial_cell() -> Cell {
        let rand = Math::random();
        match rand {
            v if v < 0.5 => Cell::Alive,
            _ => Cell::Dead,
        }
    }

    fn set_cells(&mut self, cells: &[(u32, u32)]) {
        for &(row, col) in cells.iter() {
            let i = self.index(row, col);
            self.cells[i] = Cell::Alive;
        }
    }
    
    fn index(&self, row: u32, col: u32) -> usize {
        ( row * self.width + col ) as usize
    }

    fn live_neighbors(&self, row: u32, col: u32) -> u8 {
        let mut count = 0;

        for &delta_row in [self.height - 1, 0, 1].iter() {
            for &delta_col in [self.width - 1, 0, 1].iter() {
                if delta_row == 0 && delta_col == 0 {
                    continue;
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (col + delta_col) % self.width;

                count += self.cells[self.index(neighbor_row, neighbor_col)] as u8;
            }
        }

        count
    }
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for line in self.cells.chunks(self.width as usize) {
            for &cell in line {
                match cell {
                    Cell::Dead => write!(f, "◻")?,
                    Cell::Alive => write!(f, "◼")?,
                };
            }
            write!(f, "\n")?;
        }

        Ok(())
    }
}