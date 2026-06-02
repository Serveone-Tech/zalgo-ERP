const DAILY_API_BASE = "https://api.daily.co/v1";

function getApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new Error("DAILY_API_KEY is not configured.");
  return key;
}

export async function createDailyRoom(roomName: string, expiresAt: Date) {
  const res = await fetch(`${DAILY_API_BASE}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: Math.floor(expiresAt.getTime() / 1000),
        enable_chat: false,
        enable_screenshare: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Daily.co room creation failed: ${err}`);
  }
  return res.json() as Promise<{ name: string; url: string }>;
}

export async function createMeetingToken(
  roomName: string,
  isOwner: boolean,
  expiresAt: Date,
): Promise<string> {
  const res = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        exp: Math.floor(expiresAt.getTime() / 1000),
        enable_screenshare: isOwner,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Daily.co token creation failed: ${err}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function deleteDailyRoom(roomName: string) {
  await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
}

export async function fetchRecording(roomName: string): Promise<{ id: string; download_url: string } | null> {
  const res = await fetch(`${DAILY_API_BASE}/recordings?room_name=${encodeURIComponent(roomName)}&limit=1`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) return null;
  const data = await res.json() as { data?: { id: string; download_url: string }[] };
  return data.data?.[0] ?? null;
}

export function isDailyConfigured(): boolean {
  return Boolean(process.env.DAILY_API_KEY);
}
