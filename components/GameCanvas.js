import { GAME_WIDTH, GAME_HEIGHT, PIPE_WIDTH, PIPE_GAP } from '../constants.js';

export class GameCanvas {
  constructor(engine) {
    this.engine = engine;
    this.canvas = document.createElement('canvas');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.canvas.className = 'rounded-xl shadow-2xl border-4 border-slate-700 bg-slate-900 w-full max-w-[800px] h-auto aspect-[4/3]';

    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;

    this.element = this.canvas;
    this.startRendering();
  }

  startRendering() {
    const render = () => {
      // Background
      this.ctx.fillStyle = '#0f172a'; // slate-900
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Grid
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 50) {
        this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, GAME_HEIGHT); this.ctx.stroke();
      }
      for (let i = 0; i < GAME_HEIGHT; i += 50) {
        this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(GAME_WIDTH, i); this.ctx.stroke();
      }

      // Draw Pipes
      this.ctx.fillStyle = '#22c55e'; // green-500
      this.ctx.strokeStyle = '#14532d'; // green-900
      this.ctx.lineWidth = 2;

      this.engine.pipes.forEach(pipe => {
        const currentGap = pipe.gapSize || PIPE_GAP;

        // Top Pipe
        this.ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        this.ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

        // Bottom Pipe
        const bottomY = pipe.topHeight + currentGap;
        this.ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, GAME_HEIGHT - bottomY);
        this.ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, GAME_HEIGHT - bottomY);
      });

      // Draw Birds
      // Ghost birds (semi-transparent)
      this.engine.birds.forEach(bird => {
        if (!bird.entity.alive) return;

        this.ctx.save();
        this.ctx.translate(50 + 12, bird.entity.y + 12); // Center of bird
        // Rotation based on velocity
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.entity.velocity * 0.1)));
        this.ctx.rotate(rotation);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      // Best Bird (Highlight)
      const bestBird = this.engine.getBestBird();
      if (bestBird && bestBird.entity.alive) {
        this.ctx.save();
        this.ctx.translate(50 + 12, bestBird.entity.y + 12);
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bestBird.entity.velocity * 0.1)));
        this.ctx.rotate(rotation);

        this.ctx.fillStyle = '#facc15'; // yellow-400
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();

        // Eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(6, -4, 4, 0, Math.PI*2);
        this.ctx.fill();

        this.ctx.restore();
      }

      // Ground
      this.ctx.fillStyle = '#334155';
      this.ctx.fillRect(0, GAME_HEIGHT - 10, GAME_WIDTH, 10);

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  stopRendering() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}