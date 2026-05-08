import { Worker, Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/email.queue';
import { redisConnection } from '../redis.config';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export const createEmailWorker = () => {
  return new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const { to, subject, html } = job.data;
      const from = process.env.EMAIL_FROM || 'no-reply@eduviet.vn';

      const finalHtml = html || '<p>No content provided</p>';

      await transporter.sendMail({
        from,
        to,
        subject,
        html: finalHtml,
      });
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );
};
