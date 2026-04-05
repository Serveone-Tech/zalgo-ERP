// client/src/components/subscription-banner.tsx  — REPLACE existing file
import { useAuth } from "@/contexts/auth";
import { useLocation } from "wouter";
import { AlertTriangle, Clock, X, ArrowRight } from "lucide-react";
import { useState } from "react";

export function SubscriptionBanner() {
  const { subscription } = useAuth();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (!subscription || dismissed) return null;
  if (subscription.status === "superadmin" || subscription.status === "active") {
    // Only show banner if active but expiring soon
    if (subscription.status === "active" && subscription.daysLeft > 7) return null;
    if (subscription.status === "active" && subscription.daysLeft <= 0) return null;
  }
  if (subscription.status === "none") return null;

  const isExpiring = subscription.status === "expiring_soon" || (subscription.status === "active" && subscription.daysLeft <= 7);
  const isExpired = subscription.status === "expired";

  if (!isExpiring && !isExpired) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isExpired
          ? "bg-destructive text-destructive-foreground"
          : subscription.daysLeft <= 3
          ? "bg-orange-500 text-white"
          : "bg-amber-500 text-white"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isExpired ? (
          <AlertTriangle className="w-4 h-4 shrink-0" />
        ) : (
          <Clock className="w-4 h-4 shrink-0" />
        )}
        <span className="truncate">
          {isExpired
            ? "Your subscription has expired. Renew now to continue using all features."
            : `Your ${subscription.plan?.name || "subscription"} plan expires in ${subscription.daysLeft} day${subscription.daysLeft === 1 ? "" : "s"}.`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-1 font-medium underline-offset-2 hover:underline whitespace-nowrap"
        >
          {isExpired ? "Renew Now" : "Upgrade"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
