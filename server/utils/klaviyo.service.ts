// server/utils/klaviyo.service.ts  — NEW FILE
import axios from "axios";

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY || "";
const KLAVIYO_BASE = "https://a.klaviyo.com/api";

// ── Klaviyo Profile upsert ────────────────────────────────────────────────────
export async function upsertKlaviyoProfile(profile: {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  properties?: Record<string, any>;
}): Promise<{ success: boolean; profileId?: string; error?: string }> {
  if (!KLAVIYO_API_KEY) {
    console.warn("[Klaviyo] KLAVIYO_API_KEY not set");
    return { success: false, error: "Klaviyo not configured" };
  }
  try {
    const nameParts = (profile.firstName || "").split(" ");
    const res = await axios.post(
      `${KLAVIYO_BASE}/profiles/`,
      {
        data: {
          type: "profile",
          attributes: {
            email: profile.email,
            phone_number: profile.phone ? `+91${profile.phone.replace(/\D/g, "").slice(-10)}` : undefined,
            first_name: nameParts[0] || profile.firstName,
            last_name: nameParts.slice(1).join(" ") || profile.lastName,
            properties: profile.properties || {},
          },
        },
      },
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          revision: "2024-02-15",
          "Content-Type": "application/json",
        },
      }
    );
    const profileId = res.data?.data?.id;
    console.log(`[Klaviyo] Profile upserted: ${profileId}`);
    return { success: true, profileId };
  } catch (err: any) {
    const msg = err.response?.data?.errors?.[0]?.detail || err.message;
    console.error("[Klaviyo] Profile upsert failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Trigger a Klaviyo flow event ──────────────────────────────────────────────
export async function trackKlaviyoEvent(
  email: string,
  eventName: string,
  properties?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!KLAVIYO_API_KEY) return { success: false, error: "Klaviyo not configured" };
  try {
    await axios.post(
      `${KLAVIYO_BASE}/events/`,
      {
        data: {
          type: "event",
          attributes: {
            metric: { data: { type: "metric", attributes: { name: eventName } } },
            profile: { data: { type: "profile", attributes: { email } } },
            properties: properties || {},
            time: new Date().toISOString(),
          },
        },
      },
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          revision: "2024-02-15",
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[Klaviyo] Event tracked: ${eventName} for ${email}`);
    return { success: true };
  } catch (err: any) {
    const msg = err.response?.data?.errors?.[0]?.detail || err.message;
    console.error(`[Klaviyo] Event failed:`, msg);
    return { success: false, error: msg };
  }
}

// ── Send to a Klaviyo list ────────────────────────────────────────────────────
export async function addToKlaviyoList(
  listId: string,
  profiles: Array<{ email: string; phone?: string; name?: string; properties?: Record<string, any> }>
): Promise<{ success: boolean; error?: string }> {
  if (!KLAVIYO_API_KEY) return { success: false, error: "Klaviyo not configured" };
  try {
    const members = profiles.map((p) => ({
      type: "profile",
      attributes: {
        email: p.email,
        phone_number: p.phone ? `+91${p.phone.replace(/\D/g, "").slice(-10)}` : undefined,
        first_name: p.name?.split(" ")[0],
        last_name: p.name?.split(" ").slice(1).join(" "),
        properties: p.properties || {},
      },
    }));
    await axios.post(
      `${KLAVIYO_BASE}/lists/${listId}/relationships/profiles/`,
      { data: members },
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          revision: "2024-02-15",
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[Klaviyo] Added ${profiles.length} profiles to list ${listId}`);
    return { success: true };
  } catch (err: any) {
    const msg = err.response?.data?.errors?.[0]?.detail || err.message;
    console.error("[Klaviyo] Add to list failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Fetch Klaviyo lists (for UI dropdown) ─────────────────────────────────────
export async function getKlaviyoLists(): Promise<{ id: string; name: string }[]> {
  if (!KLAVIYO_API_KEY) return [];
  try {
    const res = await axios.get(`${KLAVIYO_BASE}/lists/`, {
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        revision: "2024-02-15",
      },
    });
    return (res.data?.data || []).map((l: any) => ({
      id: l.id,
      name: l.attributes?.name || l.id,
    }));
  } catch (err: any) {
    console.error("[Klaviyo] Fetch lists failed:", err.message);
    return [];
  }
}

// ── Predefined automation event names ────────────────────────────────────────
export const KLAVIYO_EVENTS = {
  USER_REGISTERED:    "User Registered",
  PLAN_ACTIVATED:     "Plan Activated",
  PLAN_EXPIRING_SOON: "Plan Expiring Soon",
  PLAN_EXPIRED:       "Plan Expired",
  FEE_DUE:            "Fee Due",
  FEE_PAID:           "Fee Paid",
  STUDENT_ENROLLED:   "Student Enrolled",
  LEAD_CREATED:       "Lead Created",
  EXAM_SCHEDULED:     "Exam Scheduled",
  CUSTOM:             "Custom Message",
} as const;
