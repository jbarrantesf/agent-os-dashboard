/**
 * ORBIT MCP Listener
 * Escucha mensajes desde Hermes vía sessions_send()
 * Ejecuta tareas y reporta resultados
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';

const execAsync = promisify(exec);

interface Message {
  id: string;
  from: 'hermes' | 'orbit';
  type: 'task' | 'result' | 'status' | 'error' | 'ack';
  payload: Record<string, any>;
  timestamp: string;
}

class ORBITListener {
  private hermesSessionKey = 'hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd';
  private orbitSessionKey = 'agent:orbit:explicit:ORBIT-Worker';
  private activeTasks = new Map<string, Promise<any>>();

  constructor() {
    console.log('🚀 ORBIT Listener initializing...');
    console.log(`   Hermes Session: ${this.hermesSessionKey}`);
    console.log(`   ORBIT Session: ${this.orbitSessionKey}`);
  }

  /**
   * Start listening for incoming messages from Hermes
   * In production, this would use a proper event system
   * For now, we'll use a simple stdin reader for testing
   */
  async startListening() {
    console.log('\n📡 ORBIT Listener started. Waiting for messages from Hermes...\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line) as Message;
          await this.handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse message:', error);
        }
      }
    }
  }

  /**
   * Handle incoming message from Hermes
   */
  private async handleMessage(message: Message) {
    console.log(`\n📨 ORBIT received message:`, message.type);
    console.log(`   From: ${message.from}`);
    console.log(`   ID: ${message.id}`);

    switch (message.type) {
      case 'task':
        await this.handleTask(message);
        break;
      case 'status':
        await this.handleStatusQuery(message);
        break;
      case 'ack':
        await this.handleAck(message);
        break;
      default:
        console.warn(`⚠️  Unknown message type: ${message.type}`);
    }
  }

  /**
   * Execute a task
   */
  private async handleTask(message: Message) {
    const { task_id, title, command, timeout_ms = 300000 } = message.payload;

    console.log(`\n🚀 Executing task: ${task_id}`);
    console.log(`   Title: ${title}`);
    console.log(`   Command: ${command}`);

    try {
      // Execute task
      const { stdout, stderr } = await this.executeWithTimeout(command, timeout_ms);

      console.log(`✅ Task completed: ${task_id}`);
      console.log(`   Output: ${stdout.slice(0, 100)}...`);

      // Send result back to Hermes
      const resultMessage: Message = {
        id: `result-${task_id}`,
        from: 'orbit',
        type: 'result',
        payload: {
          task_id,
          status: 'completed',
          output: stdout,
          stderr: stderr || null,
          exit_code: 0,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await this.sendToHermes(resultMessage);
    } catch (error) {
      console.error(`❌ Task failed: ${task_id}`, error);

      // Send error back to Hermes
      const errorMessage: Message = {
        id: `error-${task_id}`,
        from: 'orbit',
        type: 'error',
        payload: {
          task_id,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await this.sendToHermes(errorMessage);
    }
  }

  /**
   * Handle status query
   */
  private async handleStatusQuery(message: Message) {
    console.log(`\n📊 Status query from Hermes`);

    const statusMessage: Message = {
      id: `status-${Date.now()}`,
      from: 'orbit',
      type: 'status',
      payload: {
        orbit_status: 'ready',
        active_tasks: this.activeTasks.size,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    await this.sendToHermes(statusMessage);
  }

  /**
   * Handle ACK from Hermes
   */
  private async handleAck(message: Message) {
    console.log(`\n✅ ACK received from Hermes for message: ${message.payload.ack_for}`);
  }

  /**
   * Send message to Hermes
   */
  private async sendToHermes(message: Message) {
    try {
      console.log(`\n📤 ORBIT sending to Hermes: ${message.type}`);
      console.log(`   Message ID: ${message.id}`);

      // In production, this would use sessions_send()
      // For now, we'll simulate by sending to stdout (Hermes will read stdin)
      console.log(`\n[MESSAGE_TO_HERMES]`);
      console.log(JSON.stringify(message));
      console.log(`[/MESSAGE_TO_HERMES]\n`);
    } catch (error) {
      console.error('❌ Failed to send message to Hermes:', error);
    }
  }

  /**
   * Execute command with timeout
   */
  private async executeWithTimeout(command: string, timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Command timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      exec(command, (error, stdout, stderr) => {
        clearTimeout(timeout);

        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

// Main
const listener = new ORBITListener();
listener.startListening().catch((error) => {
  console.error('Fatal error in ORBIT listener:', error);
  process.exit(1);
});
