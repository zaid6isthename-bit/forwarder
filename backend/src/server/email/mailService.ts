import { RFQData, generateRFQSubject } from './emailTemplates.js';
import { addLogEntry } from './emailLogger.js';
import { emailQueue } from './emailQueue.js';

export interface ForwarderRecipient {
  name: string;
  email: string;
  company: string;
}

export interface SendRFQEmailsResult {
  message: string;
  jobs: {
    id: string;
    recipient_email: string;
    forwarder_name: string;
    status: string;
  }[];
}

export interface IMailService {
  sendRFQEmails(rfq: RFQData, recipients: ForwarderRecipient[]): Promise<SendRFQEmailsResult>;
}

class GmailSMTPMailService implements IMailService {
  public async sendRFQEmails(rfq: RFQData, recipients: ForwarderRecipient[]): Promise<SendRFQEmailsResult> {
    if (recipients.length === 0) {
      throw new Error('No forwarder recipients provided.');
    }

    console.log(`[MAIL SERVICE] Initiating RFQ Email campaign for RFQ ID: ${rfq.referenceId}. Contacting ${recipients.length} forwarders.`);

    const subject = generateRFQSubject(rfq);
    const jobs = [];

    for (const forwarder of recipients) {
      const jobId = `job-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // 1. Create persistent log entry (status defaults to "queued")
      const logEntry = await addLogEntry({
        id: jobId,
        rfq_id: rfq.referenceId,
        recipient_email: forwarder.email,
        forwarder_name: forwarder.name,
        subject: subject
      });

      // 2. Dispatch to the background queue asynchronously
      await emailQueue.addJob(logEntry);

      jobs.push({
        id: logEntry.id,
        recipient_email: logEntry.recipient_email,
        forwarder_name: logEntry.forwarder_name,
        status: logEntry.status
      });
    }

    return {
      message: `Successfully queued ${jobs.length} email send-jobs in background.`,
      jobs
    };
  }
}

// Export the concrete instance implementing the IMailService interface
export const mailService: IMailService = new GmailSMTPMailService();
export default mailService;
