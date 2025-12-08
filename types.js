/**
 * NeuroEvolution Bird - Type Definitions
 *
 * This file defines the data structures and interfaces used throughout
 * the application. These type definitions serve as documentation and
 * help ensure consistent data structures across the codebase.
 */

// =============================================
// NEURAL NETWORK CONFIGURATION
// =============================================

/**
 * NeuralNetworkConfig
 * Defines the architecture of the neural network.
 * This matches the constants defined in constants.js and provides
 * a structured way to reference the network topology.
 */
export const NeuralNetworkConfig = {
  inputNodes: 4,
  hiddenNodes: 6,
  outputNodes: 1
};

// =============================================
// PIPE DATA STRUCTURE
// =============================================

/**
 * Pipe
 * Represents a pipe obstacle in the game.
 *
 * Properties:
 * - x: Horizontal position (pixels from left)
 * - topHeight: Height of the top pipe segment (pixels)
 * - passed: Boolean indicating if bird has passed this pipe
 * - verticalVelocity: Vertical movement speed (challenge mode only)
 * - gapSize: Current vertical gap between pipes (challenge mode)
 * - targetGapSize: Target gap size for smooth transitions
 * - directionChangeTimer: Countdown to next direction change
 * - gapChangeTimer: Countdown to next gap size change
 *
 * In challenge mode, pipes become dynamic obstacles that move vertically
 * and change their gap sizes, creating a more complex environment for
 * the neural networks to adapt to.
 */
export const Pipe = {
  x: 0,
  topHeight: 0,
  passed: false,
  verticalVelocity: undefined, // Direction: -1 (up) or 1 (down)
  gapSize: undefined, // Current gap size (replaces constant PIPE_GAP)
  targetGapSize: undefined, // Target gap size for gradual transitions
  directionChangeTimer: undefined, // Frames until next direction change
  gapChangeTimer: undefined // Frames until next gap size change
};

// =============================================
// BIRD DATA STRUCTURE
// =============================================

/**
 * Bird
 * Represents a bird entity controlled by a neural network.
 *
 * Properties:
 * - id: Unique identifier for the bird
 * - y: Vertical position (pixels from top)
 * - velocity: Current vertical velocity (pixels/frame)
 * - alive: Boolean indicating if bird is still in play
 * - fitness: Evolutionary fitness score (higher = better performance)
 * - score: Number of pipes successfully passed
 * - brain: Reference to the neural network structure for visualization
 *
 * The fitness score is the primary metric used by the genetic algorithm
 * to determine which birds reproduce. It accumulates over time based on
 * survival duration and pipes passed.
 */
export const Bird = {
  id: '',
  y: 0,
  velocity: 0,
  alive: true,
  fitness: 0,
  score: 0,
  brain: null
};

// =============================================
// NEURAL NETWORK STRUCTURE FOR VISUALIZATION
// =============================================

/**
 * NeuralNetworkStructure
 * A snapshot of the neural network's state for visualization purposes.
 *
 * This structure captures:
 * - All weights and biases (the "genome" of the neural network)
 * - The last calculated activations at each layer
 * - Input values that were processed
 *
 * The visualization component uses this data to render the network
 * topology and show real-time activation patterns as the bird
 * processes game state information.
 */
export const NeuralNetworkStructure = {
  inputWeights: [], // [inputIndex][hiddenIndex] - Weights from input to hidden layer
  outputWeights: [], // [hiddenIndex][outputIndex] - Weights from hidden to output layer
  inputBiases: [], // [hiddenIndex] - Bias values for hidden layer neurons
  outputBiases: [], // [outputIndex] - Bias values for output layer neurons
  // Last calculated activations for visualization
  lastInputs: [], // Last input values processed by the network
  lastHiddenOutputs: [], // Last activation values from hidden layer
  lastOutput: [] // Last output values from the network
};