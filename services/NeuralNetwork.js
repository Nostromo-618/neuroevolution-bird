import { MUTATION_RATE, MUTATION_AMOUNT } from '../constants.js';

// Math helpers
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const randomGaussian = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

export class NeuralNetwork {
  constructor(inputNodes, hiddenNodes, outputNodes) {
    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;

    this.weightsIH = Array(this.inputNodes).fill(0).map(() => Array(this.hiddenNodes).fill(0).map(() => Math.random() * 2 - 1));
    this.weightsHO = Array(this.hiddenNodes).fill(0).map(() => Array(this.outputNodes).fill(0).map(() => Math.random() * 2 - 1));
    this.biasH = Array(this.hiddenNodes).fill(0).map(() => Math.random() * 2 - 1);
    this.biasO = Array(this.outputNodes).fill(0).map(() => Math.random() * 2 - 1);

    // For visualization tracking
    this.lastInputs = [];
    this.lastHidden = [];
    this.lastOutputs = [];
  }

  predict(inputArray) {
    this.lastInputs = [...inputArray];

    // Input -> Hidden
    let hidden = Array(this.hiddenNodes).fill(0);
    for (let i = 0; i < this.hiddenNodes; i++) {
      let sum = 0;
      for (let j = 0; j < this.inputNodes; j++) {
        sum += inputArray[j] * this.weightsIH[j][i];
      }
      sum += this.biasH[i];
      hidden[i] = Math.tanh(sum); // Tanh for hidden layer usually works better for simple games
    }
    this.lastHidden = [...hidden];

    // Hidden -> Output
    let output = Array(this.outputNodes).fill(0);
    for (let i = 0; i < this.outputNodes; i++) {
      let sum = 0;
      for (let j = 0; j < this.hiddenNodes; j++) {
        sum += hidden[j] * this.weightsHO[j][i];
      }
      sum += this.biasO[i];
      output[i] = sigmoid(sum);
    }
    this.lastOutputs = [...output];

    return output;
  }

  // Genetic Algorithm: Mutation
  mutate() {
    const mutateValue = (val) => {
      if (Math.random() < MUTATION_RATE) {
        return val + randomGaussian() * MUTATION_AMOUNT;
      }
      return val;
    };

    this.weightsIH = this.weightsIH.map(row => row.map(mutateValue));
    this.weightsHO = this.weightsHO.map(row => row.map(mutateValue));
    this.biasH = this.biasH.map(mutateValue);
    this.biasO = this.biasO.map(mutateValue);
  }

  copy() {
    const newNet = new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes);
    // Deep copy weights and biases
    newNet.weightsIH = this.weightsIH.map(row => [...row]);
    newNet.weightsHO = this.weightsHO.map(row => [...row]);
    newNet.biasH = [...this.biasH];
    newNet.biasO = [...this.biasO];
    return newNet;
  }

  // Export structure for React state/visualization
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