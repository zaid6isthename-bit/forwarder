import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');
const LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');

export interface EmailLog {
  id: string;
  rfq_id: string;
  recipient_email: string;
  forwarder_name: string;
  subject: string;
  status: 'queued' | 'sending' | 'sent' | 'failed' | 'retrying';
  smtp_response?: string;
  retry_count: number;
  sent_at?: string;
  failed_at?: string;
  last_attempt_at?: string;
}

// Ensures the email logs database file exists on start
async function initLogsFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(LOGS_FILE);
    } catch {
      await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
      console.log('[EMAIL LOGGER] Created empty email_logs.json file.');
    }
  } catch (error: any) {
    console.error('[EMAIL LOGGER] Failed to initialize logs storage:', error.message);
  }
}

// Initialize logs storage
await initLogsFile();

export async function readLogs(): Promise<EmailLog[]> {
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[EMAIL LOGGER] Error reading email logs:', error);
    return [];
  }
}

export async function writeLogs(logs: EmailLog[]): Promise<boolean> {
  try {
    await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[EMAIL LOGGER] Error writing email logs:', error);
    return false;
  }
}

export async function addLogEntry(entry: Omit<EmailLog, 'retry_count' | 'status'>): Promise<EmailLog> {
  const logs = await readLogs();
  const newLog: EmailLog = {
    ...entry,
    status: 'queued',
    retry_count: 0,
    last_attempt_at: new Date().toISOString()
  };
  logs.push(newLog);
  await writeLogs(logs);
  return newLog;
}

export async function updateLogEntry(id: string, updates: Partial<EmailLog>): Promise<EmailLog | null> {
  const logs = await readLogs();
  const index = logs.findIndex(log => log.id === id);
  if (index === -1) return null;

  logs[index] = {
    ...logs[index],
    ...updates
  };

  await writeLogs(logs);
  return logs[index];
}

export async function getLogsByRfq(rfqId: string): Promise<EmailLog[]> {
  const logs = await readLogs();
  return logs.filter(log => log.rfq_id === rfqId);
}
