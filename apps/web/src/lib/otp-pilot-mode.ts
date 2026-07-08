/** True when phone OTP is log-only (dev or explicit pilot flag baked in at build). */
export function isOtpPilotMode(): boolean {
  if (process.env.NEXT_PUBLIC_OTP_PILOT_MODE === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}

export function getOtpPilotNoticeMessage(hasDevCode = false): string {
  if (hasDevCode) {
    if (process.env.NODE_ENV === "development") {
      return "Development mode: SMS is not sent. Your verification code is shown below.";
    }
    return "Pilot mode: SMS is not live yet. Your verification code is shown below.";
  }

  if (process.env.NODE_ENV === "development") {
    return "Development mode: SMS is not sent. Your verification code will appear here after you tap Send.";
  }
  return "Pilot mode: SMS is not live yet. Your verification code will appear here after you tap Send.";
}
