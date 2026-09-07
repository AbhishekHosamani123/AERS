import { describe, expect, it } from "vitest";

describe("Supabase AERS role catalogue", () => {
  it("contains every supported workspace role for an authenticated user", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toMatch(/^https:\/\//);
    expect(anonKey).toBeTruthy();

    const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey!, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo.assessor@abc.example.edu", password: "Demo@1234" }),
    });
    expect(authResponse.ok).toBe(true);
    const authBody = (await authResponse.json()) as { access_token: string };

    const response = await fetch(`${url}/rest/v1/roles?select=code&order=code`, {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${authBody.access_token}`,
      },
    });
    expect(response.ok).toBe(true);
    const rows = (await response.json()) as Array<{ code: string }>;
    const codes = new Set(rows.map((row) => row.code));
    expect(codes).toEqual(new Set([
      "AERS_ADMIN",
      "ASSESSOR",
      "FACILITATOR",
      "INSTITUTION_COORDINATOR",
      "INSTITUTION_LEADERSHIP",
      "LEARNER",
      "SYSTEM_ADMIN",
    ]));
  }, 15_000);
});
