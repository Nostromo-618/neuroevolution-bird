// Neural Network Configuration
export const NeuralNetworkConfig = {
  inputNodes: 4,
  hiddenNodes: 6,
  outputNodes: 1
};

// Pipe structure
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

// Bird structure
export const Bird = {
  id: '',
  y: 0,
  velocity: 0,
  alive: true,
  fitness: 0,
  score: 0,
  brain: null
};

// Neural Network Structure for visualization
export const NeuralNetworkStructure = {
  inputWeights: [], // [inputIndex][hiddenIndex]
  outputWeights: [], // [hiddenIndex][outputIndex]
  inputBiases: [], // [hiddenIndex]
  outputBiases: [], // [outputIndex]
  // Last calculated activations for visualization
  lastInputs: [],
  lastHiddenOutputs: [],
  lastOutput: []
};