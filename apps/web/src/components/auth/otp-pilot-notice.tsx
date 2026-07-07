import { Info } from "lucide-react";

import { getOtpPilotNoticeMessage, isOtpPilotMode } from "@/lib/otp-pilot-mode";

type OtpPilotNoticeProps = {
  className?: string;
};

export function OtpPilotNotice({ className }: OtpPilotNoticeProps) {
  if (!isOtpPilotMode()) return null;

  return (
    <div
      role="status"
      className={
        className ??
        "flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
      }
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <p>{getOtpPilotNoticeMessage()}</p>
    </div>
  );
}
