import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AersRoleCode } from "@/contexts/SupabaseAuthContext";

export type WorkspaceWeek = {
  number: number;
  title: string;
  description: string | null;
  progress: number;
  state: "Complete" | "In progress" | "Next up" | "Locked";
};

export type WorkspaceEvidence = {
  id: string;
  title: string;
  domain: string;
  submitted: string;
  version: string;
  status: string;
  detail: string;
  reviewer?: string;
};

export type WorkspaceDomain = {
  name: string;
  code: string;
  value: number;
  label: string;
  tone: "blue" | "teal" | "amber" | "coral";
  status: string;
};

export type LearnerWorkspace = {
  programmeName: string;
  durationWeeks: number;
  weeks: WorkspaceWeek[];
  evidence: WorkspaceEvidence[];
  domains: WorkspaceDomain[];
};

export type AssessorReview = {
  id: string;
  submissionVersionId: string;
  learner: string;
  learnerId: string;
  activity: string;
  cohort: string;
  submitted: string;
  status: string;
  priority: string;
  rubricId: string | null;
};

export type StaffWorkspace = {
  role: AersRoleCode;
  institutionCount: number;
  cohortCount: number;
  learnerCount: number;
  pendingEvidenceCount: number;
};

const tones: WorkspaceDomain["tone"][] = ["blue", "teal", "blue", "amber", "coral"];

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not submitted";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function displayName(first: string | null, last: string | null, email: string | null): string {
  return [first, last].filter(Boolean).join(" ") || email || "AERS learner";
}

function safeError(error: unknown): Error {
  return error instanceof Error ? error : new Error("We couldn't load your AERS data.");
}

export function useAersWorkspace(userId: string | null, role: AersRoleCode) {
  const [workspace, setWorkspace] = useState<LearnerWorkspace | null>(null);
  const [reviews, setReviews] = useState<AssessorReview[]>([]);
  const [staffSummary, setStaffSummary] = useState<StaffWorkspace | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (role !== "LEARNER" && role !== "ASSESSOR") {
          const [institutionsResult, cohortsResult, learnersResult, pendingResult] = await Promise.all([
            client.from("institutions").select("id", { count: "exact", head: true }),
            client.from("cohorts").select("id", { count: "exact", head: true }),
            client.from("users").select("id", { count: "exact", head: true }),
            client.from("evidence_submissions").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"]),
          ]);
          for (const result of [institutionsResult, cohortsResult, learnersResult, pendingResult]) if (result.error) throw result.error;
          if (active) setStaffSummary({ role, institutionCount: institutionsResult.count ?? 0, cohortCount: cohortsResult.count ?? 0, learnerCount: learnersResult.count ?? 0, pendingEvidenceCount: pendingResult.count ?? 0 });
          return;
        }
        if (role === "ASSESSOR") {
          const result = await client
            .from("review_assignments")
            .select("id,submission_version_id,status,due_at,assigned_at,evidence_submission_versions(submitted_at,submission_id,evidence_submissions!evidence_submission_versions_submission_id_fkey(learner_id,evidence_tasks(title,rubric_id,activities(title)),users:users!evidence_submissions_learner_id_fkey(first_name,last_name,email)))")
            .eq("assessor_id", userId)
            .order("assigned_at", { ascending: false });
          if (result.error) throw result.error;
          const rows = (result.data ?? []) as Array<Record<string, unknown>>;
          const nextReviews: AssessorReview[] = rows.map((row) => {
            const version = row.evidence_submission_versions as Record<string, unknown> | null;
            const submission = version?.evidence_submissions as Record<string, unknown> | null;
            const learner = submission?.users as Record<string, string | null> | null;
            const task = submission?.evidence_tasks as Record<string, unknown> | null;
            const activity = task?.activities as Record<string, string | null> | null;
            return {
              id: String(row.id),
              submissionVersionId: String(row.submission_version_id),
              learnerId: String(submission?.learner_id ?? ""),
              learner: displayName(learner?.first_name ?? null, learner?.last_name ?? null, learner?.email ?? null),
              activity: String(activity?.title ?? task?.title ?? "Evidence submission"),
              cohort: "Assigned cohort",
              submitted: formatDate(String(version?.submitted_at ?? row.assigned_at ?? "")),
              status: String(row.status ?? "ASSIGNED").replaceAll("_", " "),
              priority: row.due_at && new Date(String(row.due_at)) < new Date() ? "High" : "Normal",
              rubricId: task?.rubric_id ? String(task.rubric_id) : null,
            };
          });
          if (active) setReviews(nextReviews);
          return;
        }

        const enrollmentResult = await client
          .from("programme_enrollments")
          .select("programme_id,programmes(id,name,duration_weeks)")
          .eq("learner_id", userId)
          .eq("status", "ACTIVE")
          .order("enrolled_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (enrollmentResult.error) throw enrollmentResult.error;
        const enrollment = enrollmentResult.data as { programme_id: string; programmes: { id: string; name: string; duration_weeks: number } | null } | null;
        if (!enrollment?.programme_id) {
          if (active) setWorkspace({ programmeName: "AERS Employment Readiness Programme", durationWeeks: 16, weeks: [], evidence: [], domains: [] });
          return;
        }

        const [weeksResult, progressResult, evidenceResult, domainsResult, eriResult] = await Promise.all([
          client.from("programme_weeks").select("id,week_number,title,description").eq("programme_id", enrollment.programme_id).order("week_number"),
          client.from("learner_activity_progress").select("activity_id,status,activities(module_id,modules(week_id))").eq("learner_id", userId),
          client.from("evidence_submissions").select("id,status,submitted_at,current_version_id,evidence_tasks(title,activities(title,domain_code))").eq("learner_id", userId).order("updated_at", { ascending: false }),
          client.from("employability_domains").select("code,name,sequence").eq("is_active", true).order("sequence"),
          client.from("eri_profiles").select("id,profile_type").eq("learner_id", userId).eq("programme_id", enrollment.programme_id),
        ]);
        for (const result of [weeksResult, progressResult, evidenceResult, domainsResult, eriResult]) if (result.error) throw result.error;

        const progressRows = (progressResult.data ?? []) as unknown as Array<{ activity_id: string; status: string; activities: { module_id: string; modules: { week_id: string }[] }[] }>;
        const weekRows = (weeksResult.data ?? []) as Array<{ id: string; week_number: number; title: string; description: string | null }>;
        const progressByWeek = new Map<string, { total: number; complete: number }>();
        for (const row of progressRows) {
          const weekId = row.activities?.[0]?.modules?.[0]?.week_id;
          if (!weekId) continue;
          const current = progressByWeek.get(weekId) ?? { total: 0, complete: 0 };
          current.total += 1;
          if (row.status === "COMPLETED") current.complete += 1;
          progressByWeek.set(weekId, current);
        }
        const weeks: WorkspaceWeek[] = weekRows.map((week, index) => {
          const progress = progressByWeek.get(week.id);
          const percent = progress?.total ? Math.round((progress.complete / progress.total) * 100) : 0;
          const previousComplete = index === 0 || weekRows.slice(0, index).every((previous) => (progressByWeek.get(previous.id)?.complete ?? 0) > 0);
          return { number: week.week_number, title: week.title, description: week.description, progress: percent, state: percent === 100 ? "Complete" : percent > 0 ? "In progress" : previousComplete ? "Next up" : "Locked" };
        });

        const evidenceRows = (evidenceResult.data ?? []) as unknown as Array<{ id: string; status: string; submitted_at: string | null; current_version_id: string | null; evidence_tasks: { title: string; activities: { title: string; domain_code: string | null }[] }[] }>;
        const evidence: WorkspaceEvidence[] = evidenceRows.map((row) => ({
          id: row.id,
          title: row.evidence_tasks?.[0]?.title ?? row.evidence_tasks?.[0]?.activities?.[0]?.title ?? "Evidence submission",
          domain: row.evidence_tasks?.[0]?.activities?.[0]?.domain_code?.replaceAll("_", " ") ?? "Programme evidence",
          submitted: formatDate(row.submitted_at),
          version: row.current_version_id ? "current" : "draft",
          status: row.status.replaceAll("_", " "),
          detail: row.status === "APPROVED" ? "Approved by an authorised human assessor." : row.status === "REVISION_REQUIRED" ? "Read the assessor feedback and create a new version." : "This evidence is moving through the AERS review workflow.",
        }));

        const profileRows = (eriResult.data ?? []) as Array<{ id: string; profile_type: string }>;
        const profileIds = profileRows.map((row) => row.id);
        const domainResult = profileIds.length ? await client.from("eri_domain_results").select("eri_profile_id,domain_code,score,level,status").in("eri_profile_id", profileIds) : { data: [], error: null };
        if (domainResult.error) throw domainResult.error;
        const latestProfile = profileRows.find((row) => row.profile_type === "PRELIMINARY") ?? profileRows[0];
        const domainRows = (domainResult.data ?? []).filter((row) => row.eri_profile_id === latestProfile?.id) as Array<{ domain_code: string; score: number | null; level: string | null; status: string }>;
        const domainDefinitions = (domainsResult.data ?? []) as Array<{ code: string; name: string; sequence: number }>;
        const domains: WorkspaceDomain[] = domainDefinitions.map((domain, index) => {
          const result = domainRows.find((row) => row.domain_code === domain.code);
          return { code: domain.code, name: domain.name, value: Number(result?.score ?? 0), label: (result?.level ?? "PENDING").replaceAll("_", " "), tone: tones[index % tones.length], status: result?.status ?? "PENDING" };
        });

        if (active) setWorkspace({ programmeName: enrollment.programmes?.name ?? "AERS Employment Readiness Programme", durationWeeks: enrollment.programmes?.duration_weeks ?? 16, weeks, evidence, domains });
      } catch (loadError) {
        console.error("[AERS] Workspace query failed", loadError);
        if (active) setError(safeError(loadError).message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [role, userId]);

  return { workspace, reviews, staffSummary, loading, error };
}
