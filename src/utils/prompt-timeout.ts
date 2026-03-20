import chalk from 'chalk';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

let timer: NodeJS.Timeout | null = null;

/**
 * Starts an inactivity timer. If no prompt is answered within TIMEOUT_MS,
 * the process exits with a friendly message.
 * Call resetPromptTimeout() each time a prompt is answered to restart the timer.
 */
export function startPromptTimeout(): void {
  resetPromptTimeout();
}

export function resetPromptTimeout(): void {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    console.log();
    console.log(chalk.yellow('⏰ Session timed out due to inactivity (5 minutes).'));
    console.log(chalk.gray('Run the command again when you are ready.'));
    process.exit(0);
  }, TIMEOUT_MS);

  // Don't keep the process alive just for the timer
  if (timer.unref) {
    timer.unref();
  }
}

export function clearPromptTimeout(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
