import "server-only";
import nodemailer from "nodemailer";

/**
 * SMTP sender. Configure via env (works with Gmail/Workspace app passwords or any SMTP):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * If unset, sending is a safe no-op that reports why — the app never crashes on it.
 */

export type SendResult = { sent: boolean; reason?: string };

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass },
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendStatusRequestEmail(opts: {
  to: string;
  ownerName?: string | null;
  projectName: string;
  projectUrl?: string;
  requesterName?: string;
}): Promise<SendResult> {
  const transport = getTransport();
  if (!transport) return { sent: false, reason: "Email not configured (set SMTP_* env vars)." };

  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const requester = opts.requesterName ?? "Akash";
  const greeting = opts.ownerName ? `Hi ${opts.ownerName},` : "Hi,";
  const link = opts.projectUrl ? `\n\nView on the dashboard: ${opts.projectUrl}` : "";

  const text =
    `${greeting}\n\n${requester} has requested a status update on “${opts.projectName}”.\n\n` +
    `Please update your project portal so the latest status reflects on the central dashboard.${link}\n\n` +
    `— Master Dashboard`;

  const html =
    `<p>${greeting}</p>` +
    `<p><strong>${requester}</strong> has requested a status update on <strong>${escapeHtml(opts.projectName)}</strong>.</p>` +
    `<p>Please update your project portal so the latest status reflects on the central dashboard.</p>` +
    (opts.projectUrl ? `<p><a href="${opts.projectUrl}">View on the dashboard →</a></p>` : "") +
    `<p style="color:#888">— Master Dashboard</p>`;

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject: `Status update requested: ${opts.projectName}`,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Failed to send email." };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
