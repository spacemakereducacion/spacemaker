export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailAdapter {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailAdapter implements EmailAdapter {
  async send(message: EmailMessage) {
    console.info("[email:console]", {
      to: message.to,
      subject: message.subject,
      text: message.text ?? message.html.replace(/<[^>]+>/g, " ").slice(0, 280),
    });
  }
}

class SmtpEmailAdapter implements EmailAdapter {
  async send(): Promise<void> {
    throw new Error(
      "El adaptador SMTP está preparado. Configure SMTP_HOST, SMTP_USER y SMTP_PASSWORD para habilitarlo.",
    );
  }
}

export function getEmailAdapter(): EmailAdapter {
  if ((process.env.EMAIL_DRIVER ?? "console") === "smtp" && process.env.SMTP_HOST) {
    return new SmtpEmailAdapter();
  }
  return new ConsoleEmailAdapter();
}

export async function sendSystemEmail(message: EmailMessage) {
  await getEmailAdapter().send(message);
}
