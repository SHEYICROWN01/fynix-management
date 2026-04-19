import * as React from "react";
import { AlertTriangle } from "lucide-react";

interface DemoDataBannerProps {
    message?: string;
}

export function DemoDataBanner({
    message = "This page is displaying demo data. Connect the backend API to show live data.",
}: DemoDataBannerProps) {
    return (
        <div className= "flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300" >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{ message } </span>
            </div>
  );
}
