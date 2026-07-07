/** True when phone OTP is log-only (dev or explicit pilot flag baked in at build). */
export function isOtpPilotMode(): boolean {
  if (process.env.NEXT_PUBLIC_OTP_PILOT_MODE === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}

export function getOtpPilotNoticeMessage(): string {
  if (process.env.NODE_ENV === "development") {
    return "Development mode: verification codes are printed in the API console — no SMS is sent.";
  }
  return "Pilot mode: SMS is not live yet. Codes are written to the API server logs. Ask your operator to retrieve the code (see pilot runbook).";
}
