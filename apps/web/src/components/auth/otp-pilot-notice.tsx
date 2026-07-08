import { Info } from "lucide-react";

import { getOtpPilotNoticeMessage, isOtpPilotMode } from "@/lib/otp-pilot-mode";

type OtpPilotNoticeProps = {
  className?: string;
  devCode?: string | null;
};

export function OtpPilotNotice({ className, devCode }: OtpPilotNoticeProps) {
  if (!isOtpPilotMode()) return null;

  const code = devCode?.trim() || null;

  return (
    <div
      role="status"
      className={
        className ??
        "flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
      }
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0">
        <p>{getOtpPilotNoticeMessage(Boolean(code))}</p>
        {code ? (
          <p
            className="mt-2 font-mono text-lg font-semibold tracking-[0.2em] text-amber-950"
            aria-label={`Verification code ${code.split("").join(" ")}`}
          >
            {code}
          </p>
        ) : null}
      </div>
    </div>
  );
}
