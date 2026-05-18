import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmailLog, readLogs, updateLogEntry } from './emailLogger.js';
import { createTransporter, verifyTransporter, isMockSMTP, getSMTPConfig } from './smtpTransporter.js';
import { generateRFQEmailHtml, generateRFQSubject, RFQData } from './emailTemplates.js';
import nodemailer from 'nodemailer';

export class EmailQueueManager {
  private static instance: EmailQueueManager;
  private queue: EmailLog[] = [];
  private isProcessing: boolean = false;
  private transporter: nodemailer.Transporter | null = null;
  private rateLimitMs: number = 2000; // 2 seconds between emails to respect Gmail rate limits

  private constructor() {
    this.initTransporter();
  }

  public static getInstance(): EmailQueueManager {
    if (!EmailQueueManager.instance) {
      EmailQueueManager.instance = new EmailQueueManager();
    }
    return EmailQueueManager.instance;
  }

  private async initTransporter() {
    try {
      this.transporter = await createTransporter();
      if (this.transporter) {
        await verifyTransporter(this.transporter);
      }
    } catch (err: any) {
      console.error('[EMAIL QUEUE] Transporter init failed. Will operate in fallback mode:', err.message);
    }
  }

  // Load any unfinished jobs from email_logs.json on server start
  public async resumePendingJobs() {
    console.log('[EMAIL QUEUE] Scanning email logs to resume pending sends...');
    const logs = await readLogs();
    const pending = logs.filter(log => log.status === 'queued' || log.status === 'retrying' || log.status === 'sending');
    
    if (pending.length > 0) {
      console.log(`[EMAIL QUEUE] Found ${pending.length} pending emails to resume.`);
      for (const job of pending) {
        // If it was marked "sending", set it back to "queued" or "retrying" to avoid stuck states
        if (job.status === 'sending') {
          job.status = job.retry_count > 0 ? 'retrying' : 'queued';
          await updateLogEntry(job.id, { status: job.status });
        }
        
        // If it was retrying, schedule it with exponential delay based on current retry count
        if (job.status === 'retrying') {
          const delay = Math.pow(2, job.retry_count) * 5000;
          console.log(`[EMAIL QUEUE] Rescheduling job ${job.id} to retry in ${delay / 1000}s`);
          setTimeout(() => this.enqueueJobDirect(job), delay);
        } else {
          this.queue.push(job);
        }
      }
      this.triggerProcessor();
    } else {
      console.log('[EMAIL QUEUE] No pending emails found.');
    }
  }

  private enqueueJobDirect(job: EmailLog) {
    this.queue.push(job);
    this.triggerProcessor();
  }

  // Enqueue a new email job
  public async addJob(job: EmailLog) {
    // Check if duplicate send (already sent or queued)
    const logs = await readLogs();
    const existing = logs.find(l => l.rfq_id === job.rfq_id && l.recipient_email === job.recipient_email);
    
    if (existing && (existing.status === 'sent' || existing.status === 'sending' || existing.status === 'queued')) {
      console.log(`[EMAIL QUEUE] Skipping duplicate email request for RFQ ${job.rfq_id} to ${job.recipient_email}`);
      return;
    }

    this.queue.push(job);
    console.log(`[EMAIL QUEUE] Job ${job.id} added to send list (RFQ: ${job.rfq_id}, To: ${job.recipient_email})`);
    this.triggerProcessor();
  }

  private triggerProcessor() {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        await this.processJob(job);
      } catch (err: any) {
        console.error(`[EMAIL QUEUE] Error processing job ${job.id}:`, err.message);
      }
    }

    // Schedule next job with rate limit delay
    setTimeout(() => this.processQueue(), this.rateLimitMs);
  }

  private async processJob(job: EmailLog) {
    console.log(`[EMAIL QUEUE] Processing send job ${job.id} for ${job.recipient_email}...`);
    
    // Update state to sending
    await updateLogEntry(job.id, { 
      status: 'sending',
      last_attempt_at: new Date().toISOString()
    });

    const isMock = isMockSMTP();
    const config = getSMTPConfig();

    // Re-verify/init transporter if missing and not in mock mode
    if (!isMock && !this.transporter) {
      await this.initTransporter();
    }

    // Mock Send Fallback
    if (isMock) {
      await this.handleMockSend(job, config);
      return;
    }

    // Real SMTP Send
    try {
      if (!this.transporter) throw new Error('Transporter could not be initialized');

      // Fetch quote details to rebuild HTML or parse it
      // For resilience we passed the template/payload information.
      // Wait, we need the RFQ details. We can read them from quotes.json or pass them to the job structure.
      // To keep backend decoupled and robust, we can query `backend/data/quotes.json` to get the quote fields.
      const rfq = await this.fetchRfqData(job.rfq_id);
      if (!rfq) throw new Error(`Quotation RFQ data not found for ID: ${job.rfq_id}`);

      const html = generateRFQEmailHtml(rfq, job.forwarder_name, 'Logistics Partner', config.senderName, config.senderEmail);
      const subject = generateRFQSubject(rfq);

      const mailOptions = {
        from: `"${config.senderName}" <${config.senderEmail}>`,
        to: job.recipient_email,
        subject: subject,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL QUEUE] Email sent successfully to ${job.recipient_email} (Msg ID: ${info.messageId})`);

      await updateLogEntry(job.id, {
        status: 'sent',
        smtp_response: `Message-ID: ${info.messageId}`,
        sent_at: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`[EMAIL QUEUE] Failed to send email to ${job.recipient_email}:`, error.message);
      await this.handleFailure(job, error.message);
    }
  }

  private async handleMockSend(job: EmailLog, config: any) {
    // Simulate minor delay
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('\n======================================================');
    console.log(`[EMAIL QUEUE] [SMTP MOCK SEND SUCCESS] Job ID: ${job.id}`);
    console.log(`To: ${job.forwarder_name} <${job.recipient_email}>`);
    console.log(`Subject: ${job.subject}`);
    console.log(`From: "${config.senderName}" <${config.senderEmail}>`);
    console.log('Body: Professional HTML RFQ Email generated successfully.');
    console.log('======================================================\n');

    await updateLogEntry(job.id, {
      status: 'sent',
      smtp_response: `MOCK_SUCCESS_ID_${Date.now()}`,
      sent_at: new Date().toISOString()
    });
  }

  private async handleFailure(job: EmailLog, errorMessage: string) {
    const nextRetry = job.retry_count + 1;
    
    if (nextRetry <= 3) {
      console.log(`[EMAIL QUEUE] Scheduling retry #${nextRetry} for job ${job.id} due to: ${errorMessage}`);
      
      await updateLogEntry(job.id, {
        status: 'retrying',
        retry_count: nextRetry,
        smtp_response: errorMessage
      });

      // Schedule retry with exponential delay: 2^retry * 5000ms (5s, 10s, 20s)
      const delay = Math.pow(2, nextRetry) * 5000;
      
      const updatedJob: EmailLog = {
        ...job,
        status: 'retrying',
        retry_count: nextRetry,
        smtp_response: errorMessage
      };

      setTimeout(() => this.enqueueJobDirect(updatedJob), delay);
    } else {
      console.error(`[EMAIL QUEUE] Job ${job.id} failed after maximum retry attempts. Marking as FAILED.`);
      
      await updateLogEntry(job.id, {
        status: 'failed',
        smtp_response: `Final Error: ${errorMessage}`,
        failed_at: new Date().toISOString()
      });
    }
  }

  private async fetchRfqData(rfqId: string): Promise<RFQData | null> {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const quotesFile = path.join(__dirname, '..', '..', '..', 'data', 'quotes.json');
      const data = await fs.readFile(quotesFile, 'utf-8');
      const quotes = JSON.parse(data);
      const quote = quotes.find((q: any) => q.referenceId === rfqId || q.id === rfqId);
      return quote || null;
    } catch (err: any) {
      console.error('[EMAIL QUEUE] fetchRfqData error:', err.message);
      return null;
    }
  }
}
export const emailQueue = EmailQueueManager.getInstance();
