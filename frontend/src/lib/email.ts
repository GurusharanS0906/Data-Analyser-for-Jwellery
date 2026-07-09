/**
 * No SMTP/Resend provider is configured yet, so this logs the reset link to the
 * server console — enough to test the full forgot-password flow locally.
 * Swap the body of this function for a real provider call when one is wired up.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  console.log(`[email] Password reset requested for ${to}`);
  console.log(`[email] Reset link: ${resetUrl}`);
}
