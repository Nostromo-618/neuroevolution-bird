// Game Constants
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GRAVITY = 0.6;
export const LIFT = -10;
export const VELOCITY_LIMIT = 10; // Terminal velocity
export const MAX_PIPE_VERTICAL_SPEED = 8; // 80% of VELOCITY_LIMIT for fairness

export const PIPE_SPEED = 3;
export const PIPE_SPAWN_RATE = 100; // Frames between pipes
export const PIPE_GAP = 150;
export const PIPE_WIDTH = 60;

export const POPULATION_SIZE = 50;
export const MUTATION_RATE = 0.1; // Probability of a weight being mutated
export const MUTATION_AMOUNT = 0.1; // Max amount to change a weight by

// Neural Network Topology
// Inputs: Vertical Distance to Pipe, Horizontal Distance, Velocity, Bias
export const INPUT_NODES = 4;
export const HIDDEN_NODES = 6;
export const OUTPUT_NODES = 1;