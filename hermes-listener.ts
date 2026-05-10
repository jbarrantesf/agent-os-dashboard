/**
 * Hermes MCP Listener
 * Escucha resultados desde ORBIT vía sessions_send()
 * Procesa y reporta a José
 */

import * as readline from 'readline';

interface Message {
  id: string;
  from: 'hermes' | 'orbit';
  type: 'task' | 'result' | 'status' | 'error' | 'ack';
  payload: Record<string, any>;
  timestamp: string;
}

class HermesListener {
  private hermesSessionKey = 'hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd';
  private orbitSessionKey = 'agent:orbit:explicit:ORBIT-Worker';
  private taskRegistry = new Map<string, any>();

  constructor() {
    console.log('🚀 Hermes Listener initializing...');
    console.log(`   Hermes Session: ${this.hermesSessionKey}`);
    console.log(`   ORBIT Session: ${this.orbitSessionKey}`);
  }

  /**
   * Start listening for incoming messages from ORBIT
   */
  async startListening() {
    console.log('\n📡 Hermes Listener started. Waiting for messages from ORBIT...\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    for await (const line of rl) {
      if (line.includes('[MESSAGE_FROM_ORBIT]') || line.trim().startsWith('{')) {
        try {
          // Parse message
          let messageJson = line;
          if (line.includes('[MESSAGE_FROM_ORBIT]')) {
            // Extract JSON between markers
            const match = line.match(/\{.*\}/);
            if (match) messageJson = match[0];
          }

          const message = JSON.parse(messageJson) as Message;
          await this.handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse message:', error);
        }
      }
    }
  }

  /**
   * Handle incoming message from ORBIT
   */
  private async handleMessage(message: Message) {
    console.log(`\n📨 Hermes received message: ${message.type}`);
    console.log(`   From: ${message.from}`);
    console.log(`   ID: ${message.id}`);

    switch (message.type) {
      case 'result':
        await this.handleTaskResult(message);
        break;
      case 'error':
        await this.handleTaskError(message);
        break;
      case 'status':
        await this.handleStatusUpdate(message);
        break;
      default:
        console.warn(`⚠️  Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle successful task result from ORBIT
   */
  private async handleTaskResult(message: Message) {
    const { task_id, output, exit_code } = message.payload;

    console.log(`\n✅ Task completed: ${task_id}`);
    console.log(`   Exit code: ${exit_code}`);
    console.log(`   Output: ${output.slice(0, 200)}...`);

    // Update task registry
    this.taskRegistry.set(task_id, {
      status: 'completed',
      result: message.payload,
      completedAt: new Date().toISOString(),
    });

    // Send ACK back to ORBIT
    await this.sendAckToORBIT(message.id);

    // Report to José (simulate Telegram)
    await this.reportToJose(`✅ Task ${task_id} completed\n${output.slice(0, 100)}`);
  }

  /**
   * Handle task error from ORBIT
   */
  private async handleTaskError(message: Message) {
    const { task_id, error } = message.payload;

    console.log(`\n❌ Task failed: ${task_id}`);
    console.log(`   Error: ${error}`);

    // Update task registry
    this.taskRegistry.set(task_id, {
      status: 'failed',
      error: message.payload,
      failedAt: new Date().toISOString(),
    });

    // Send ACK back to ORBIT
    await this.sendAckToORBIT(message.id);

    // Report to José
    await this.reportToJose(`❌ Task ${task_id} failed\nError: ${error}`);
  }

  /**
   * Handle status update from ORBIT
   */
  private async handleStatusUpdate(message: Message) {
    const { orbit_status, active_tasks } = message.payload;

    console.log(`\n📊 Status update from ORBIT:`);
    console.log(`   Status: ${orbit_status}`);
    console.log(`   Active tasks: ${active_tasks}`);

    // Send ACK
    await this.sendAckToORBIT(message.id);
  }

  /**
   * Send task to ORBIT
   */
  async sendTaskToORBIT(task: { task_id: string; title: string; command: string; timeout_ms?: number }) {
    try {
      console.log(`\n📤 Hermes sending task to ORBIT: ${task.task_id}`);
      console.log(`   Title: ${task.title}`);
      console.log(`   Command: ${task.command}`);

      const message: Message = {
        id: `task-${task.task_id}`,
        from: 'hermes',
        type: 'task',
        payload: task,
        timestamp: new Date().toISOString(),
      };

      // Store in registry
      this.taskRegistry.set(task.task_id, {
        status: 'pending',
        task,
        createdAt: new Date().toISOString(),
      });

      // In production, this would use sessions_send()
      // For now, simulate by sending to stdout
      console.log(`\n[MESSAGE_TO_ORBIT]`);
      console.log(JSON.stringify(message));
      console.log(`[/MESSAGE_TO_ORBIT]\n`);

      return message.id;
    } catch (error) {
      console.error('❌ Failed to send task to ORBIT:', error);
      throw error;
    }
  }

  /**
   * Send ACK to ORBIT
   */
  private async sendAckToORBIT(messageId: string) {
    try {
      console.log(`\n🤝 Hermes sending ACK to ORBIT for: ${messageId}`);

      const ackMessage: Message = {
        id: `ack-${messageId}`,
        from: 'hermes',
        type: 'ack',
        payload: {
          ack_for: messageId,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      // Simulate sending
      console.log(`\n[MESSAGE_TO_ORBIT]`);
      console.log(JSON.stringify(ackMessage));
      console.log(`[/MESSAGE_TO_ORBIT]\n`);
    } catch (error) {
      console.error('❌ Failed to send ACK:', error);
    }
  }

  /**
   * Report to José (simulate Telegram)
   */
  private async reportToJose(message: string) {
    console.log(`\n📱 [TELEGRAM TO JOSÉ]`);
    console.log(`   ${message}`);
    console.log(`   Time: ${new Date().toLocaleString()}`);
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string) {
    return this.taskRegistry.get(taskId) || { status: 'unknown' };
  }

  /**
   * List all tasks
   */
  listTasks() {
    return Array.from(this.taskRegistry.entries()).map(([id, data]) => ({
      task_id: id,
      ...data,
    }));
  }
}

// Export for use in REPL or other context
export const hermesListener = new HermesListener();

// Main (if run as script)
if (require.main === module) {
  hermesListener.startListening().catch((error) => {
    console.error('Fatal error in Hermes listener:', error);
    process.exit(1);
  });
}
