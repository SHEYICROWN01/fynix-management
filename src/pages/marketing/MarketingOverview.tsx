import { ActivityFeedCard, ApprovalInboxCard, KpiRow } from "./components/Panels";

/** Quick summary: today's numbers, what the team did recently, and what needs your decision. */
export default function MarketingOverview() {
  return (
    <div className="space-y-5">
      <KpiRow />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <ActivityFeedCard limit={12} />
        <ApprovalInboxCard className="self-start" />
      </div>
    </div>
  );
}
