import type { NotificationChannel } from "@prisma/client";
import { db } from "@/lib/db";
import { sendSystemEmail } from "@/lib/email";

type NotifyInput = {
  userId: string;
  title: string;
  body: string;
  href?: string;
  channel?: NotificationChannel;
  email?: string | null;
};

class ChannelAdapter {
  constructor(private readonly name: string) {}
  async send(payload: { to?: string | null; title: string; body: string }) {
    console.info(`[${this.name}:console]`, payload);
  }
}

export async function notifyUser(input: NotifyInput) {
  const channel = input.channel ?? "IN_APP";
  await db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      channel,
    },
  });

  if (channel === "EMAIL" && input.email) {
    await sendSystemEmail({
      to: input.email,
      subject: input.title,
      html: `<p>${input.body}</p>`,
      text: input.body,
    });
  }

  if (channel === "WHATSAPP") {
    await new ChannelAdapter("whatsapp").send({
      to: input.email,
      title: input.title,
      body: input.body,
    });
  }
  if (channel === "SMS") {
    await new ChannelAdapter("sms").send({
      to: input.email,
      title: input.title,
      body: input.body,
    });
  }
  if (channel === "PUSH") {
    await new ChannelAdapter("push").send({
      to: input.userId,
      title: input.title,
      body: input.body,
    });
  }
}
