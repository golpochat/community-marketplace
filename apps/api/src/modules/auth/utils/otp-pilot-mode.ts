/** True when OTP is log-only (dev or explicit pilot flag). Never enable with live SMS. */
export function isOtpPilotMode(): boolean {
  if (process.env.OTP_PILOT_MODE === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}
