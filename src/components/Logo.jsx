import { Link } from "react-router-dom";
import { Icon } from "./ui";

/** Brand mark: indigo chip icon + project name. */
export default function Logo({ size = "md" }) {
  const box = size === "lg" ? "h-9 w-9" : "h-8 w-8";
  const text = size === "lg" ? "text-lg" : "text-base";
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg">
      <span
        className={`flex ${box} items-center justify-center rounded-lg bg-primary text-white shadow-card`}
      >
        <Icon name="chip" className="h-[18px] w-[18px]" />
      </span>
      <span className={`${text} font-semibold tracking-tight text-ink`}>PCB Defect Detection</span>
    </Link>
  );
}
