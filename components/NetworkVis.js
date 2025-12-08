/**
 * NeuroEvolution Bird - Neural Network Visualization
 *
 * This component provides real-time visualization of the neural network
 * that controls the best bird. It shows:
 * - Network topology (4 input → 6 hidden → 1 output)
 * - Connection weights (color and thickness)
 * - Neuron activations (color intensity)
 * - Current input values and decisions
 *
 * The visualization helps understand how the neural network processes
 * game state information and makes flapping decisions.
 */

export class NetworkVis {
  /**
   * Constructor - Sets up visualization canvas and UI
   */
  constructor() {
    // Create canvas for network drawing
    this.canvas = document.createElement('canvas');
    this.canvas.width = 300;
    this.canvas.height = 200;
    this.ctx = this.canvas.getContext('2d');
    this.brain = null; // Will store neural network structure

    // Create container div with styling
    this.container = document.createElement('div');
    this.container.className = 'bg-slate-800/80 backdrop-blur rounded-lg p-4 shadow-xl border border-slate-700';

    // Add title
    const title = document.createElement('h3');
    title.className = 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1';
    title.textContent = 'Neural Real-time Vis';
    this.container.appendChild(title);

    // Add canvas to container
    this.container.appendChild(this.canvas);

    // Add layer labels
    const labels = document.createElement('div');
    labels.className = 'flex justify-between text-[10px] text-slate-500 mt-2 font-mono';
    labels.innerHTML = `
      <span>INPUTS</span>
      <span>HIDDEN</span>
      <span>OUTPUT</span>
    `;
    this.container.appendChild(labels);

    this.element = this.container; // DOM element reference
  }

  /**
   * Update Brain - Updates visualization with new network state
   *
   * @param {Object} brain - Neural network structure from GameEngine
   */
  updateBrain(brain) {
    this.brain = brain;
    this.render(); // Trigger re-render
  }

  /**
   * Render - Draws the neural network visualization
   *
   * Visualizes:
   * - Network topology and connections
   * - Weight values (color and thickness)
   * - Current activations (color intensity)
   * - Input labels and output decisions
   */
  render() {
    if (!this.brain) return; // No brain data available

    // Extract network structure
    const { inputWeights, outputWeights, lastInputs, lastHiddenOutputs, lastOutput } = this.brain;
    const inputCount = inputWeights.length; // 4 inputs
    const hiddenCount = outputWeights.length; // 6 hidden neurons
    const outputCount = outputWeights[0].length; // 1 output

    // Layout calculations
    const layerGap = this.canvas.width / 3; // Space between layers
    const startX = 40; // Starting X position
    const inputYStart = (this.canvas.height - (inputCount * 30)) / 2; // Center inputs vertically
    const hiddenYStart = (this.canvas.height - (hiddenCount * 30)) / 2; // Center hidden layer
    const outputYStart = (this.canvas.height - (outputCount * 30)) / 2; // Center output

    // Helper function to calculate node positions
    const getPos = (layer, index, count) => {
      let x = startX + layer * layerGap;
      let yStart = layer === 0 ? inputYStart : layer === 1 ? hiddenYStart : outputYStart;
      let y = yStart + index * 30; // 30px vertical spacing
      return { x, y };
    };

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ===== DRAW INPUT → HIDDEN CONNECTIONS =====
    for (let i = 0; i < inputCount; i++) {
      for (let j = 0; j < hiddenCount; j++) {
        const weight = inputWeights[i][j];
        const start = getPos(0, i, inputCount);
        const end = getPos(1, j, hiddenCount);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);

        // Visualize weight magnitude as line thickness
        this.ctx.lineWidth = Math.abs(weight) * 2;

        // Visualize weight sign as color
        // Positive weights = green, Negative weights = red
        this.ctx.strokeStyle = weight > 0 ? 'rgba(100, 255, 100, 0.4)' : 'rgba(255, 100, 100, 0.4)';
        this.ctx.stroke();
      }
    }

    // ===== DRAW HIDDEN → OUTPUT CONNECTIONS =====
    for (let i = 0; i < hiddenCount; i++) {
      for (let j = 0; j < outputCount; j++) {
        const weight = outputWeights[i][j];
        const start = getPos(1, i, hiddenCount);
        const end = getPos(2, j, outputCount);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);

        // Thicker lines for output connections
        this.ctx.lineWidth = Math.abs(weight) * 3;

        // More opaque for output connections
        this.ctx.strokeStyle = weight > 0 ? 'rgba(100, 255, 100, 0.6)' : 'rgba(255, 100, 100, 0.6)';
        this.ctx.stroke();
      }
    }

    // ===== DRAW NODES =====
    const drawNode = (x, y, value, label) => {
      // Draw node circle
      this.ctx.beginPath();
      this.ctx.arc(x, y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1e293b'; // slate-800 (dark background)
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#94a3b8'; // slate-400 (light border)
      this.ctx.stroke();

      // Draw activation indicator
      this.ctx.beginPath();
      // Normalize activation value to [0, 1] range for visualization
      const intensity = Math.min(Math.max(value, 0), 1);
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(56, 189, 248, ${intensity})`; // Sky blue with variable intensity
      this.ctx.fill();

      // Draw label if provided
      if (label) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(label, x - 25, y + 4);
      }
    };

    // ===== DRAW INPUT NODES =====
    const inputLabels = ["Bird Y", "Pipe X", "Gap Y", "Vel"];
    for (let i = 0; i < inputCount; i++) {
      const pos = getPos(0, i, inputCount);
      const val = lastInputs ? lastInputs[i] : 0; // Current input value
      drawNode(pos.x, pos.y, val, inputLabels[i]);
    }

    // ===== DRAW HIDDEN NODES =====
    for (let i = 0; i < hiddenCount; i++) {
      const pos = getPos(1, i, hiddenCount);
      // Convert tanh output (-1 to 1) to visualization range (0 to 1)
      const val = lastHiddenOutputs ? (lastHiddenOutputs[i] + 1) / 2 : 0;
      drawNode(pos.x, pos.y, val);
    }

    // ===== DRAW OUTPUT NODES =====
    for (let i = 0; i < outputCount; i++) {
      const pos = getPos(2, i, outputCount);
      const val = lastOutput ? lastOutput[i] : 0; // Current output value

      // Show "JUMP" label if output > 0.5
      const jumpLabel = val > 0.5 ? "JUMP" : "";
      drawNode(pos.x, pos.y, val, jumpLabel);

      // Add glow effect when jumping
      if (val > 0.5) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.stroke();
      }
    }
  }
}

// =============================================
// VISUALIZATION DESIGN PRINCIPLES
// =============================================

/**
 * VISUALIZATION DESIGN
 *
 * 1. TOPOLOGY REPRESENTATION
 * - 3-column layout: Input → Hidden → Output
 * - Spaced evenly across canvas width
 * - Vertical centering of each layer
 *
 * 2. WEIGHT VISUALIZATION
 * - Color: Green (positive), Red (negative)
 * - Thickness: Proportional to absolute weight value
 * - Opacity: Input→Hidden (40%), Hidden→Output (60%)
 *
 * 3. ACTIVATION VISUALIZATION
 * - Sky blue color with intensity based on activation
 * - Inputs: 0-1 normalized values
 * - Hidden: Tanh (-1 to 1) converted to 0-1
 * - Output: 0-1 sigmoid output
 *
 * 4. DECISION INDICATION
 * - "JUMP" label appears when output > 0.5
 * - White glow effect on active output
 * - Real-time updates show decision making
 *
 * 5. EDUCATIONAL LABELS
 * - Input labels show what each neuron represents
 * - Clear layer labeling (INPUTS, HIDDEN, OUTPUT)
 * - Visual feedback helps understand network behavior
 *
 * This visualization transforms abstract neural network
 * computations into understandable visual patterns,
 * making the AI's decision process transparent and educational.
 */