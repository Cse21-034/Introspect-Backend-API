// Notification service for sending SMS via Twilio and Email via SendGrid
// This module provides placeholder functions that can be connected to actual services when integrations are set up

interface SendSMSParams {
  to: string;
  message: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
}

export async function sendSMS(params: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  const twilioConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  if (!twilioConfigured) {
    console.log('[SMS] Twilio not configured - SMS would be sent:', params);
    return { success: true }; // Return success in dev mode
  }

  try {
    // TODO: Integrate with Twilio connector when available
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: params.message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: params.to
    // });
    
    console.log('[SMS] Would send to:', params.to, 'Message:', params.message);
    return { success: true };
  } catch (error: any) {
    console.error('[SMS] Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const sendGridConfigured = !!process.env.SENDGRID_API_KEY;

  if (!sendGridConfigured) {
    console.log('[Email] SendGrid not configured - Email would be sent:', params);
    return { success: true }; // Return success in dev mode
  }

  try {
    // TODO: Integrate with SendGrid connector when available
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: params.to,
    //   from: process.env.SENDGRID_FROM_EMAIL,
    //   subject: params.subject,
    //   text: params.message,
    //   html: `<p>${params.message}</p>`,
    // });
    
    console.log('[Email] Would send to:', params.to, 'Subject:', params.subject);
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Error:', error.message);
    return { success: false, error: error.message };
  }
}

export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

export function isSendGridConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}
