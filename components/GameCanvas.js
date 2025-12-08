/**
 * NeuroEvolution Bird - Game Canvas Renderer
 *
 * This component handles the visual rendering of the game:
 * - Game world (background, grid)
 * - Pipes (static and dynamic)
 * - Birds (population and highlighted best bird)
 * - Ground
 *
 * Uses HTML5 Canvas API for efficient 2D rendering.
 * Implements animation loop with requestAnimationFrame.
 */

import { GAME_WIDTH, GAME_HEIGHT, PIPE_WIDTH, PIPE_GAP } from '../constants.js';

export class GameCanvas {
  /**
   * Constructor - Sets up canvas and starts rendering
   *
   * @param {GameEngine} engine - Reference to game engine
   */
  constructor(engine) {
    this.engine = engine;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.canvas.className = 'rounded-xl shadow-2xl border-4 border-slate-700 bg-slate-900 w-full max-w-[800px] h-auto aspect-[4/3]';

    // Get 2D rendering context
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null; // Animation frame ID

    this.element = this.canvas; // DOM element reference
    this.startRendering(); // Begin animation loop
  }

  /**
   * Start Rendering - Begins the animation loop
   *
   * Uses requestAnimationFrame for smooth 60 FPS rendering.
   * Each frame renders the complete game state.
   */
  startRendering() {
    const render = () => {
      // ===== BACKGROUND =====
      // Clear canvas with dark background
      this.ctx.fillStyle = '#0f172a'; // slate-900
      this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // ===== GRID =====
      // Draw reference grid for better spatial awareness
      this.ctx.strokeStyle = '#1e293b'; // slate-800
      this.ctx.lineWidth = 1;

      // Vertical grid lines
      for (let i = 0; i < GAME_WIDTH; i += 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, GAME_HEIGHT);
        this.ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i < GAME_HEIGHT; i += 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(GAME_WIDTH, i);
        this.ctx.stroke();
      }

      // ===== PIPES =====
      // Draw all pipes with green color scheme
      this.ctx.fillStyle = '#22c55e'; // green-500
      this.ctx.strokeStyle = '#14532d'; // green-900
      this.ctx.lineWidth = 2;

      this.engine.pipes.forEach(pipe => {
        const currentGap = pipe.gapSize || PIPE_GAP;

        // Top Pipe Segment
        this.ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        this.ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

        // Bottom Pipe Segment
        const bottomY = pipe.topHeight + currentGap;
        this.ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, GAME_HEIGHT - bottomY);
        this.ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, GAME_HEIGHT - bottomY);
      });

      // ===== BIRDS =====
      // Draw regular birds (semi-transparent)
      this.engine.birds.forEach(bird => {
        if (!bird.entity.alive) return;

        // Save current canvas state
        this.ctx.save();

        // Position at bird center (50, bird.y) with 24px size
        this.ctx.translate(50 + 12, bird.entity.y + 12);

        // Apply rotation based on velocity (visual feedback)
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.entity.velocity * 0.1)));
        this.ctx.rotate(rotation);

        // Draw bird as white circle
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Restore canvas state
        this.ctx.restore();
      });

      // ===== BEST BIRD (HIGHLIGHTED) =====
      // Draw the champion bird with special styling
      const bestBird = this.engine.getBestBird();
      if (bestBird && bestBird.entity.alive) {
        this.ctx.save();
        this.ctx.translate(50 + 12, bestBird.entity.y + 12);

        // Apply velocity-based rotation
        const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bestBird.entity.velocity * 0.1)));
        this.ctx.rotate(rotation);

        // Draw larger yellow bird
        this.ctx.fillStyle = '#facc15'; // yellow-400
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Add white outline
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();

        // Add eye for personality
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(6, -4, 4, 0, Math.PI*2);
        this.ctx.fill();

        this.ctx.restore();
      }

      // ===== GROUND =====
      // Draw ground at bottom of screen
      this.ctx.fillStyle = '#334155'; // slate-700
      this.ctx.fillRect(0, GAME_HEIGHT - 10, GAME_WIDTH, 10);

      // Schedule next frame
      this.animationId = requestAnimationFrame(render);
    };

    // Start the animation loop
    render();
  }

  /**
   * Stop Rendering - Stops the animation loop
   *
   * Called when:
   * - Game is paused
   * - Component is unmounted
   * - Game is reset
   */
  stopRendering() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// =============================================
// RENDERING STRATEGY
// =============================================

/**
 * RENDERING APPROACH
 *
 * 1. IMMEDIATE MODE RENDERING
 * - Each frame completely redraws the scene
 * - No retained mode or scene graph
 * - Simple and efficient for this use case
 *
 * 2. CANVAS OPTIMIZATIONS
 * - Minimal state changes (fillStyle, strokeStyle)
 * - Batching similar draw calls
 * - Using save/restore for transformations
 *
 * 3. VISUAL DESIGN
 * - Dark theme for better contrast
 * - Grid helps understand spatial relationships
 * - Color coding: green pipes, white birds, yellow champion
 * - Semi-transparent birds to see through population
 *
 * 4. PERFORMANCE
 * - requestAnimationFrame for 60 FPS
 * - Simple geometric primitives (rects, arcs)
 * - No complex textures or shaders
 *
 * The rendering is designed to be educational - showing
 * the complete game state clearly while maintaining
 * good performance for real-time evolution.
 */