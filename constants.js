/**
 * NeuroEvolution Bird - Game Constants
 *
 * This file contains all the fundamental parameters that define the game physics,
 * neural network architecture, and evolutionary algorithm settings.
 * These constants create the "environment" in which the neural networks evolve.
 */

// =============================================
// GAME PHYSICS CONSTANTS
// =============================================

/**
 * GAME_WIDTH & GAME_HEIGHT (800x600)
 * Defines the playable area dimensions. The neural network receives
 * normalized inputs (0-1) based on these dimensions, so changing them
 * would require retraining the network.
 */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/**
 * GRAVITY (0.6 pixels/frame²)
 * The acceleration due to gravity that pulls birds downward.
 * This creates the fundamental challenge - birds must flap to counteract gravity.
 * In physics terms: v = v₀ + at, where a = GRAVITY
 */
export const GRAVITY = 0.6;

/**
 * LIFT (-10 pixels/frame)
 * The upward velocity impulse when a bird flaps its wings.
 * This is the only control mechanism the neural network has.
 * The network outputs a value (0-1) that determines whether to flap.
 */
export const LIFT = -10;

/**
 * VELOCITY_LIMIT (10 pixels/frame)
 * Terminal velocity - prevents birds from accelerating infinitely.
 * This is a game design choice to make the game playable.
 * Real physics: v_terminal = √(2mg/ρAC_d)
 */
export const VELOCITY_LIMIT = 10; // Terminal velocity

/**
 * MAX_PIPE_VERTICAL_SPEED (8 pixels/frame)
 * Maximum vertical movement speed for pipes in challenge mode.
 * Set to 80% of VELOCITY_LIMIT for fairness - pipes shouldn't move
 * faster than birds can reasonably react to.
 */
export const MAX_PIPE_VERTICAL_SPEED = 8; // 80% of VELOCITY_LIMIT for fairness

// =============================================
// PIPE MECHANICS CONSTANTS
// =============================================

/**
 * PIPE_SPEED (3 pixels/frame)
 * Horizontal scrolling speed of pipes.
 * Determines game difficulty - faster pipes = less reaction time.
 */
export const PIPE_SPEED = 3;

/**
 * PIPE_SPAWN_RATE (100 frames)
 * Number of frames between spawning new pipes.
 * At 60 FPS, this means a new pipe every ~1.67 seconds.
 * Controls game pacing and difficulty progression.
 */
export const PIPE_SPAWN_RATE = 100; // Frames between pipes

/**
 * PIPE_GAP (150 pixels)
 * The vertical space between top and bottom pipes.
 * Birds must navigate through this gap.
 * This is the "target" that the neural network learns to aim for.
 */
export const PIPE_GAP = 150;

/**
 * PIPE_WIDTH (60 pixels)
 * Horizontal width of each pipe.
 * Determines how precise the bird's horizontal positioning must be.
 */
export const PIPE_WIDTH = 60;

// =============================================
// NEUROEVOLUTION ALGORITHM CONSTANTS
// =============================================

/**
 * POPULATION_SIZE (50 birds)
 * Number of birds in each generation.
 * Larger populations provide more genetic diversity but are computationally expensive.
 * Smaller populations evolve faster but risk getting stuck in local optima.
 */
export const POPULATION_SIZE = 50;

/**
 * MUTATION_RATE (0.1 = 10%)
 * Probability that any given weight in the neural network will be mutated.
 * This is the "exploration rate" - higher values introduce more randomness,
 * lower values preserve successful strategies longer.
 * In genetic algorithms: P(mutation) = 0.1
 */
export const MUTATION_RATE = 0.1; // Probability of a weight being mutated

/**
 * MUTATION_AMOUNT (0.1)
 * Maximum amount by which a weight can change during mutation.
 * Controls the "step size" of evolution.
 * Too high: destructive mutations that break working networks
 * Too low: evolution happens too slowly
 * Uses Gaussian distribution for smooth, natural variation.
 */
export const MUTATION_AMOUNT = 0.1; // Max amount to change a weight by

// =============================================
// NEURAL NETWORK TOPOLOGY
// =============================================

/**
 * NEURAL NETWORK ARCHITECTURE: 4-6-1
 *
 * INPUT_NODES (4):
 * 1. Bird Y position (normalized 0-1)
 * 2. Horizontal distance to next pipe (normalized 0-1)
 * 3. Vertical position of pipe gap center (normalized 0-1)
 * 4. Bird velocity (normalized -1 to 1)
 *
 * These 4 inputs provide the complete "state" information needed for the
 * bird to make decisions. The neural network learns to map these inputs
 * to the optimal action (flap or don't flap).
 */
export const INPUT_NODES = 4;

/**
 * HIDDEN_NODES (6)
 * Number of neurons in the hidden layer.
 * More hidden neurons = more complex decision boundaries, but also:
 * - Increased computational cost
 * - Risk of overfitting to the training environment
 * - Longer training time
 * 6 neurons is a good balance for this simple game.
 */
export const HIDDEN_NODES = 6;

/**
 * OUTPUT_NODES (1)
 * Single output neuron that determines whether to flap.
 * Output range: 0 (don't flap) to 1 (flap)
 * Threshold: if output > 0.5, the bird flaps.
 * This is a binary classification problem.
 */
export const OUTPUT_NODES = 1;