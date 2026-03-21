import { CopyButton } from "./CopyButton";

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  copyable?: string;
  mono?: boolean;
}

export function DetailRow({ label, value, copyable, mono }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className={`flex items-center gap-1 text-sm break-all ${mono ? "font-mono" : ""}`}>
        {value}
        {copyable && <CopyButton value={copyable} />}
      </dd>
    </div>
  );
}
