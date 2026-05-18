import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

export interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderName: string;
  senderEmail: string;
}

export function getSMTPConfig(): SMTPConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'zaid6isthename@gmail.com',
    pass: process.env.SMTP_PASS || '',
    senderName: process.env.SENDER_NAME || 'FreightBid Logistics',
    senderEmail: process.env.SENDER_EMAIL || 'zaid6isthename@gmail.com',
  };
}

export function isMockSMTP(): boolean {
  const config = getSMTPConfig();
  const isMock = 
    !config.user || 
    config.user.includes('your_email') || 
    config.user === '' || 
    !config.pass || 
    config.pass.includes('your_app_password') ||
    config.pass === '';
  return isMock;
}

export async function createTransporter() {
  const config = getSMTPConfig();
  const isMock = isMockSMTP();

  if (isMock) {
    console.log('[SMTP SERVICE] Initializing in MOCK MODE because SMTP_USER or SMTP_PASS is not configured.');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // True for 465, false for 587
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false // Avoid self-signed cert issues
      }
    });

    return transporter;
  } catch (error: any) {
    console.error('[SMTP SERVICE] Error creating transporter:', error.message);
    throw error;
  }
}

export async function verifyTransporter(transporter: nodemailer.Transporter | null): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.verify();
    console.log('[SMTP SERVICE] Transporter verified successfully. SMTP connection ready.');
    return true;
  } catch (error: any) {
    console.error('[SMTP SERVICE] Transporter verification failed:', error.message);
    return false;
  }
}
