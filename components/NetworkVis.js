export class NetworkVis {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 300;
    this.canvas.height = 200;
    this.ctx = this.canvas.getContext('2d');
    this.brain = null;

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'bg-slate-800/80 backdrop-blur rounded-lg p-4 shadow-xl border border-slate-700';

    const title = document.createElement('h3');
    title.className = 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1';
    title.textContent = 'Neural Real-time Vis';
    this.container.appendChild(title);

    this.container.appendChild(this.canvas);

    const labels = document.createElement('div');
    labels.className = 'flex justify-between text-[10px] text-slate-500 mt-2 font-mono';
    labels.innerHTML = `
      <span>INPUTS</span>
      <span>HIDDEN</span>
      <span>OUTPUT</span>
    `;
    this.container.appendChild(labels);

    this.element = this.container;
  }

  updateBrain(brain) {
    this.brain = brain;
    this.render();
  }

  render() {
    if (!this.brain) return;

    const { inputWeights, outputWeights, lastInputs, lastHiddenOutputs, lastOutput } = this.brain;
    const inputCount = inputWeights.length; // 4
    const hiddenCount = outputWeights.length; // 6
    const outputCount = outputWeights[0].length; // 1

    const layerGap = this.canvas.width / 3;
    const startX = 40;
    const inputYStart = (this.canvas.height - (inputCount * 30)) / 2;
    const hiddenYStart = (this.canvas.height - (hiddenCount * 30)) / 2;
    const outputYStart = (this.canvas.height - (outputCount * 30)) / 2;

    const getPos = (layer, index, count) => {
      let x = startX + layer * layerGap;
      let yStart = layer === 0 ? inputYStart : layer === 1 ? hiddenYStart : outputYStart;
      let y = yStart + index * 30;
      return { x, y };
    };

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Connections Input -> Hidden
    for (let i = 0; i < inputCount; i++) {
      for (let j = 0; j < hiddenCount; j++) {
        const weight = inputWeights[i][j];
        const start = getPos(0, i, inputCount);
        const end = getPos(1, j, hiddenCount);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineWidth = Math.abs(weight) * 2;
        this.ctx.strokeStyle = weight > 0 ? 'rgba(100, 255, 100, 0.4)' : 'rgba(255, 100, 100, 0.4)';
        this.ctx.stroke();
      }
    }

    // Draw Connections Hidden -> Output
    for (let i = 0; i < hiddenCount; i++) {
      for (let j = 0; j < outputCount; j++) {
        const weight = outputWeights[i][j];
        const start = getPos(1, i, hiddenCount);
        const end = getPos(2, j, outputCount);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineWidth = Math.abs(weight) * 3;
        this.ctx.strokeStyle = weight > 0 ? 'rgba(100, 255, 100, 0.6)' : 'rgba(255, 100, 100, 0.6)';
        this.ctx.stroke();
      }
    }

    // Draw Nodes
    const drawNode = (x, y, value, label) => {
      this.ctx.beginPath();
      this.ctx.arc(x, y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#1e293b'; // slate-800
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.stroke();

      // Activation fill
      this.ctx.beginPath();
      // Normalize value for visual (-1 to 1 usually, but here inputs are 0-1 mostly)
      const intensity = Math.min(Math.max(value, 0), 1);
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(56, 189, 248, ${intensity})`; // Sky blue
      this.ctx.fill();

      if (label) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(label, x - 25, y + 4);
      }
    };

    // Inputs
    const inputLabels = ["Bird Y", "Pipe X", "Gap Y", "Vel"];
    for (let i = 0; i < inputCount; i++) {
      const pos = getPos(0, i, inputCount);
      const val = lastInputs ? lastInputs[i] : 0;
      drawNode(pos.x, pos.y, val, inputLabels[i]);
    }

    // Hidden
    for (let i = 0; i < hiddenCount; i++) {
      const pos = getPos(1, i, hiddenCount);
      // Tanh output is -1 to 1, visualize absolute strength or shift
      const val = lastHiddenOutputs ? (lastHiddenOutputs[i] + 1) / 2 : 0;
      drawNode(pos.x, pos.y, val);
    }

    // Output
    for (let i = 0; i < outputCount; i++) {
      const pos = getPos(2, i, outputCount);
      const val = lastOutput ? lastOutput[i] : 0;
      drawNode(pos.x, pos.y, val, val > 0.5 ? "JUMP" : "");

      // Glow if jumping
      if (val > 0.5) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.stroke();
      }
    }
  }
}