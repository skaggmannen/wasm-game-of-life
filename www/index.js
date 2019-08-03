import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

import { Universe, Cell } from "wasm-game-of-life";

const UNIVERSE_WIDTH = 64;
const UNIVERSE_HEIGHT = 64;

const CELL_SIZE_PX = 10;
const BORDER_SIZE_PX = 1;
const GRID_COLOR = '#CCCCCC';
const DEAD_COLOR = '#FFFFFF';
const ALIVE_COLOR = '#000000';

let universe = Universe.new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT);

let animationId = null;

const isPaused = () => {
    return animationId == null;
}

const playPauseButton = document.getElementById("play-pause");

const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
}

const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
};

playPauseButton.addEventListener("click", event => {
    if (isPaused()) {
        play();
    } else {
        pause();
    }
});

const resetButton = document.getElementById("reset");

resetButton.addEventListener("click", event => {
    universe = Universe.new(UNIVERSE_WIDTH, UNIVERSE_HEIGHT);
    render();
});


const newButton = document.getElementById("new");

newButton.addEventListener("click", event => {
    universe = Universe.new_empty(UNIVERSE_WIDTH, UNIVERSE_HEIGHT);
    render();
});

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE_PX + BORDER_SIZE_PX) * UNIVERSE_HEIGHT + BORDER_SIZE_PX;
canvas.width = (CELL_SIZE_PX + BORDER_SIZE_PX) * UNIVERSE_WIDTH + BORDER_SIZE_PX;

const ctx = canvas.getContext('2d');


const renderLoop = () => {
    render(); 
    universe.tick();   

    animationId = requestAnimationFrame(renderLoop);
}

const render = () => {
    drawGrid(ctx);
    drawCells(ctx);
}

const drawGrid = ctx => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    drawVerticalLines(ctx);
    drawHorizontalLines(ctx);

    ctx.stroke();
}

const drawVerticalLines = ctx => {
    for (let i = 0; i < UNIVERSE_WIDTH + 1; i++) {
        ctx.moveTo(i * (CELL_SIZE_PX + 1) + 1, 0);
        ctx.lineTo(i * (CELL_SIZE_PX + 1) + 1, UNIVERSE_HEIGHT * (CELL_SIZE_PX + 1) + 1);
    }
}

const drawHorizontalLines = ctx => {
    for (let i = 0; i < UNIVERSE_HEIGHT + 1; i++) {
        ctx.moveTo(0, i * (CELL_SIZE_PX + 1) + 1);
        ctx.lineTo(UNIVERSE_WIDTH * (CELL_SIZE_PX + 1) + 1, i * (CELL_SIZE_PX + 1) + 1);
    }
}

const drawCells = (ctx) => {
    let cells = new Uint8Array(memory.buffer, universe.cells(), UNIVERSE_WIDTH * UNIVERSE_HEIGHT);

    ctx.beginPath();

    drawAliveCells(ctx, cells);
    drawDeadCells(ctx, cells);

    ctx.stroke();
}

const drawAliveCells = (ctx, cells) => {
    drawCellsWithState(ctx, cells, Cell.Alive)
}

const drawDeadCells = (ctx, cells) => {
    drawCellsWithState(ctx, cells, Cell.Dead)
}

const drawCellsWithState = (ctx, cells, state) => {
    ctx.fillStyle = state == Cell.Dead? DEAD_COLOR : ALIVE_COLOR;
    
    for (let row = 0; row < UNIVERSE_HEIGHT; row++) {
        for (let col = 0; col < UNIVERSE_WIDTH; col++) {
            let cell = cells[index(row, col)];
            if (cell != state) {
                continue;
            }
            
            ctx.fillRect(
                col * (CELL_SIZE_PX + 1) + 1,
                row * (CELL_SIZE_PX + 1) + 1,
                CELL_SIZE_PX,
                CELL_SIZE_PX
            );
        }
    }
}

canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;
  
    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;
  
    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE_PX + 1)), UNIVERSE_HEIGHT - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE_PX + 1)), UNIVERSE_WIDTH - 1);
  
    universe.toggle_cell(row, col);
  
    drawGrid(ctx);
    drawCells(ctx);
});

const index = (row, col) => {
    return row * UNIVERSE_WIDTH + col;
}

render();