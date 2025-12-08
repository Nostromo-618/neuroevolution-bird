/**
 * NeuroEvolution Bird - Neural Network Implementation
 *
 * This file contains the core neural network implementation that serves
 * as the "brain" for each bird. The neural network processes game state
 * information and makes decisions about when to flap.
 *
 * ARCHITECTURE: Feedforward Neural Network (4-6-1)
 * - Input Layer: 4 neurons (game state information)
 * - Hidden Layer: 6 neurons (feature extraction)
 * - Output Layer: 1 neuron (flap decision)
 *
 * This is a classic multilayer perceptron (MLP) with:
 * - Tanh activation in hidden layer
 * - Sigmoid activation in output layer
 * - Full connectivity between layers
 */

import { MUTATION_RATE, MUTATION_AMOUNT } from '../constants.js';

// =============================================
// ACTIVATION FUNCTIONS
// =============================================

/**
 * SIGMOID ACTIVATION FUNCTION
 * σ(x) = 1 / (1 + e^(-x))
 *
 * Properties:
 * - Range: (0, 1) - perfect for binary classification
 * - S-shaped curve that saturates at extremes
 * - Differentiable: σ'(x) = σ(x)(1-σ(x))
 * - Used in output layer to get probability-like output
 *
 * Why sigmoid for output?
 * We want a smooth 0-1 output representing "probability to flap"
 * The network learns to output values > 0.5 when flapping is optimal
 */
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/**
 * GAUSSIAN (NORMAL) DISTRIBUTION FOR MUTATION
 * Uses Box-Muller transform to generate normally distributed random numbers.
 *
 * Why Gaussian mutation?
 * - Small mutations are more common than large ones
 * - Preserves successful strategies while allowing exploration
 * - Mimics natural evolution where most mutations are neutral/slight
 * - Mean = 0, Standard deviation = 1
 *
 * The mutation amount is scaled by MUTATION_AMOUNT constant
 */
const randomGaussian = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// =============================================
// NEURAL NETWORK CLASS
// =============================================

/**
 * NeuralNetwork Class
 *
 * A feedforward neural network that implements:
 * 1. Forward propagation (predict method)
 * 2. Genetic mutation (mutate method)
 * 3. Network copying (copy method)
 * 4. State export (getStructure method)
 *
 * This is the "genome" that evolves through genetic algorithms.
 */
export class NeuralNetwork {
  /**
   * Constructor - Initializes neural network with random weights
   *
   * @param {number} inputNodes - Number of input neurons (4)
   * @param {number} hiddenNodes - Number of hidden neurons (6)
   * @param {number} outputNodes - Number of output neurons (1)
   *
   * Weight initialization: Random values in range [-1, 1]
   * This provides initial diversity in the population.
   */
  constructor(inputNodes, hiddenNodes, outputNodes) {
    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;

    // Initialize weights with random values [-1, 1]
    // weightsIH: Input -> Hidden weights [inputNodes][hiddenNodes]
    this.weightsIH = Array(this.inputNodes).fill(0).map(() => Array(this.hiddenNodes).fill(0).map(() => Math.random() * 2 - 1));

    // weightsHO: Hidden -> Output weights [hiddenNodes][outputNodes]
    this.weightsHO = Array(this.hiddenNodes).fill(0).map(() => Array(this.outputNodes).fill(0).map(() => Math.random() * 2 - 1));

    // Bias terms - allow the network to shift activation functions
    // biasH: Hidden layer biases [hiddenNodes]
    this.biasH = Array(this.hiddenNodes).fill(0).map(() => Math.random() * 2 - 1);

    // biasO: Output layer biases [outputNodes]
    this.biasO = Array(this.outputNodes).fill(0).map(() => Math.random() * 2 - 1);

    // For visualization tracking - store last activations
    this.lastInputs = [];
    this.lastHidden = [];
    this.lastOutputs = [];
  }

  /**
   * Forward Propagation - Predicts output given input
   *
   * @param {Array} inputArray - Array of 4 normalized input values
   * @returns {Array} - Array with single output value (0-1)
   *
   * This is the core computation: input → hidden → output
   * Each layer applies: sum(inputs * weights) + bias → activation
   */
  predict(inputArray) {
    // Store inputs for visualization
    this.lastInputs = [...inputArray];

    // ===== INPUT → HIDDEN LAYER =====
    let hidden = Array(this.hiddenNodes).fill(0);

    // For each hidden neuron
    for (let i = 0; i < this.hiddenNodes; i++) {
      let sum = 0;

      // Sum weighted inputs
      for (let j = 0; j < this.inputNodes; j++) {
        sum += inputArray[j] * this.weightsIH[j][i];
      }

      // Add bias term
      sum += this.biasH[i];

      // Apply TANH activation function
      // Why Tanh? Range [-1, 1] centered at 0, better for hidden layers
      // Tanh = (e^x - e^-x) / (e^x + e^-x)
      hidden[i] = Math.tanh(sum);
    }
    this.lastHidden = [...hidden];

    // ===== HIDDEN → OUTPUT LAYER =====
    let output = Array(this.outputNodes).fill(0);

    // For each output neuron (just 1 in this case)
    for (let i = 0; i < this.outputNodes; i++) {
      let sum = 0;

      // Sum weighted hidden activations
      for (let j = 0; j < this.hiddenNodes; j++) {
        sum += hidden[j] * this.weightsHO[j][i];
      }

      // Add bias term
      sum += this.biasO[i];

      // Apply SIGMOID activation function
      // Converts to probability-like output [0, 1]
      output[i] = sigmoid(sum);
    }
    this.lastOutputs = [...output];

    return output;
  }

  // =============================================
  // GENETIC ALGORITHM METHODS
  // =============================================

  /**
   * MUTATION - Introduces random changes to network weights
   *
   * This implements the genetic mutation operator:
   * 1. Each weight has MUTATION_RATE chance to be mutated
   * 2. Mutation amount follows Gaussian distribution
   * 3. Both weights and biases can mutate
   *
   * Mutation is the source of genetic diversity that allows
   * the population to explore new strategies.
   */
  mutate() {
    const mutateValue = (val) => {
      if (Math.random() < MUTATION_RATE) {
        // Apply Gaussian mutation scaled by MUTATION_AMOUNT
        return val + randomGaussian() * MUTATION_AMOUNT;
      }
      return val;
    };

    // Mutate all weights and biases
    this.weightsIH = this.weightsIH.map(row => row.map(mutateValue));
    this.weightsHO = this.weightsHO.map(row => row.map(mutateValue));
    this.biasH = this.biasH.map(mutateValue);
    this.biasO = this.biasO.map(mutateValue);
  }

  /**
   * COPY - Creates exact duplicate of this network
   *
   * Used for reproduction - offspring inherit parent's genome
   * Creates deep copy to prevent reference sharing
   *
   * @returns {NeuralNetwork} - New network with identical weights
   */
  copy() {
    const newNet = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);

    // Deep copy all weights and biases
    newNet.weightsIH = this.weightsIH.map(row => [...row]);
    newNet.weightsHO = this.weightsHO.map(row => [...row]);
    newNet.biasH = [...this.biasH];
    newNet.biasO = [...this.biasO];

    return newNet;
  }

  /**
   * GET STRUCTURE - Exports network state for visualization
   *
   * @returns {Object} - Network structure with weights, biases, and activations
   *
   * Used by NetworkVis component to render the neural network
   * and show real-time activation patterns.
   */
  getStructure() {
    return {
      inputWeights: this.weightsIH,
      outputWeights: this.weightsHO,
      inputBiases: this.biasH,
      outputBiases: this.biasO,
      lastInputs: this.lastInputs,
      lastHiddenOutputs: this.lastHidden,
      lastOutput: this.lastOutputs
    };
  }
}

// =============================================
// NEURAL NETWORK THEORY EXPLANATION
// =============================================

/**
 * NEURAL NETWORK THEORY - HOW IT WORKS
 *
 * 1. NEURON MODEL
 * Each neuron computes: output = activation(Σ(inputs × weights) + bias)
 * This is the fundamental "perceptron" model from 1958.
 *
 * 2. FEEDFORWARD PROPAGATION
 * Information flows: Input → Hidden → Output
 * No cycles, no feedback - purely reactive decision making.
 *
 * 3. ACTIVATION FUNCTIONS
 * - Tanh: Hyperbolic tangent, range [-1, 1]
 *   * Better for hidden layers because centered at 0
 *   * Helps with gradient flow during learning
 * - Sigmoid: Logistic function, range [0, 1]
 *   * Perfect for binary output (flap/don't flap)
 *   * Output can be interpreted as probability
 *
 * 4. UNIVERSAL APPROXIMATION THEOREM
 * A feedforward network with a single hidden layer containing
 * a finite number of neurons can approximate any continuous
 * function to arbitrary accuracy, given appropriate weights.
 * This means our 4-6-1 network CAN learn the optimal flapping strategy.
 *
 * 5. LEARNING THROUGH EVOLUTION
 * Instead of backpropagation, we use genetic algorithms:
 * - Selection: Better performing networks reproduce more
 * - Crossover: Not implemented here (simplified)
 * - Mutation: Random changes to weights create diversity
 * - Elitism: Best network is preserved unchanged
 *
 * 6. FITNESS FUNCTION
 * The genetic algorithm optimizes for survival time and pipes passed.
 * This is an implicit fitness function - networks that keep birds
 * alive longer get to reproduce more.
 *
 * 7. WHY THIS WORKS FOR FLAPPY BIRD
 * The game state can be fully described by 4 continuous variables.
 * The optimal flapping strategy is a continuous function mapping
 * these 4 inputs to a binary output. Neural networks excel at
 * learning such mappings through function approximation.
 */