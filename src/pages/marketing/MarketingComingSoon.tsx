import { Link, useParams } from "react-router-dom";
import { ArrowRight, Hammer } from "lucide-react";
import { card } from "./components/shared";

const plans: Record<string, string[]> = {
  campaigns: [
    "Content calendar of posts and articles written by the Content Writer",
    "Email and WhatsApp follow-up sequences (day 3, day 7, day 14…)",
    "Approve, schedule or pause each campaign",
  ],
  institutions: [
    "Database of prospective MFBs, cooperatives and lenders",
    "Import from CSV and from public licence lists",
    "Contact consent and opt-out tracking",
  ],
  reports: [
    "Conversion rate per stage and per agent",
    "Best-performing channels and messages",
    "Weekly report sent to you by the Manager agent",
  ],
  settings: [
    "Target states and institution types",
    "Channels on/off, daily sending limits and AI spending cap",
    "Approval rules: which messages always need a human",
  ],
};

export default function MarketingComingSoon() {
  const { section = "" } = useParams();
  const items = plans[section];
  return (
    <div className={`${card} mx-auto max-w-2xl p-8 text-center`}>
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0FF] text-[#2250CC]"><Hammer size={26} /></span>
      <h2 className="text-[22px] font-extrabold text-[#0F1B3D]">Coming in Phase 1</h2>
      <p className="mt-1 text-[14px] text-[#64748B]">This section will be built when we connect the AI team to real data.</p>
      {items && (
        <ul className="mx-auto mt-5 max-w-md space-y-2 text-left">
          {items.map((item) => <li key={item} className="flex gap-2 rounded-xl bg-[#F4F7FC] px-3 py-2 text-[13.5px] text-[#334155]"><ArrowRight size={15} className="mt-0.5 shrink-0 text-[#2250CC]" />{item}</li>)}
        </ul>
      )}
      <Link to="/marketing" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(90deg,#2250CC,#3B6FE8)] px-4 py-2.5 text-[13.5px] font-semibold text-white">Go to AI Marketing Office<ArrowRight size={15} /></Link>
    </div>
  );
}
