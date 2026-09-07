import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  Home as HomeIcon,
  Inbox,
  Info,
  Layers3,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSupabaseAuth, type AersRoleCode } from "@/contexts/SupabaseAuthContext";
import { useAersWorkspace, type AssessorReview, type LearnerWorkspace, type StaffWorkspace } from "@/hooks/useAersWorkspace";
import { supabase } from "@/lib/supabase";

type Role = "learner" | "assessor" | "staff";
type EvidenceStatus = "Approved" | "Under review" | "Revision required" | "Not started";

type EvidenceItem = {
  id: string;
  title: string;
  domain: string;
  submitted: string;
  version: string;
  status: string;
  detail: string;
  reviewer?: string;
};

type ReviewItem = AssessorReview;

const navItems = [
  { label: "Home", icon: HomeIcon },
  { label: "Programme", icon: BookOpen },
  { label: "Assessments", icon: ClipboardCheck },
  { label: "Evidence", icon: FileCheck2 },
  { label: "Feedback", icon: MessageSquareText },
  { label: "ERI profile", icon: BarChart3 },
  { label: "Passport", icon: ShieldCheck },
];

function AersMark() {
  return (
    <div className="brand-mark" aria-label="AERS">
      <span className="brand-orbit brand-orbit-one" />
      <span className="brand-orbit brand-orbit-two" />
      <span className="brand-dot" />
      <span className="brand-wordmark">AERS</span>
    </div>
  );
}

function StatusBadge({ status }: { status: EvidenceStatus | string }) {
  const normalizedStatus = status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const styles: Record<string, string> = {
    Approved: "status-approved",
    "Under review": "status-review",
    "Revision required": "status-revision",
    "Not started": "status-muted",
    "New review": "status-review",
    Revision: "status-revision",
    Overdue: "status-overdue",
  };
  return (
    <span className={`status-badge ${styles[normalizedStatus] ?? "status-muted"}`}>
      <span className="status-dot" aria-hidden="true" />
      {normalizedStatus}
    </span>
  );
}

function ProgressBar({ value, tone = "blue" }: { value: number; tone?: string }) {
  return (
    <div className={`progress-track progress-${tone}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Sidebar({
  active,
  setActive,
  role,
  displayName,
  roleLabel,
  onSignOut,
  reviewCount,
}: {
  active: string;
  setActive: (value: string) => void;
  role: Role;
  displayName: string;
  roleLabel: string;
  onSignOut: () => void;
  reviewCount: number;
}) {
  return (
    <aside className="sidebar" aria-label="Application sidebar">
      <div className="sidebar-top">
        <AersMark />
        <button className="workspace-switcher" onClick={() => toast("Workspace switcher is ready for institution scoping.")}>
          <span className="workspace-avatar">A</span>
          <span>
            <strong>ABC College</strong>
            <small>Pilot cohort · 2026</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </div>

      <div>
        <div className="nav-label">Workspace</div>
        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${active === item.label ? "nav-item-active" : ""}`}
                onClick={() => setActive(item.label)}
              >
                <Icon size={18} strokeWidth={active === item.label ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {role === "assessor" ? (
          <>
            <div className="nav-label nav-label-spaced">Assessor tools</div>
            <nav className="main-nav" aria-label="Assessor navigation">
              {[
                { label: "Review queue", icon: Inbox, count: reviewCount },
                { label: "Learners", icon: UsersRound },
                { label: "Rubrics", icon: Layers3 },
                { label: "Reports", icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active === item.label ? "nav-item-active" : ""}`}
                    onClick={() => setActive(item.label)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.count ? <em>{item.count}</em> : null}
                  </button>
                );
              })}
            </nav>
          </>
        ) : role === "staff" ? (
          <>
            <div className="nav-label nav-label-spaced">Institution tools</div>
            <nav className="main-nav" aria-label="Institution navigation">
              {[
                { label: "Cohorts", icon: UsersRound },
                { label: "Reports", icon: BarChart3 },
                { label: "Programme admin", icon: Layers3 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${active === item.label ? "nav-item-active" : ""}`}
                    onClick={() => setActive(item.label)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </>
        ) : null}
      </div>

      <div className="sidebar-bottom">
        <div className="support-card">
          <Sparkles size={17} />
          <div>
            <strong>Need a hand?</strong>
            <p>Open the journey guide for your next step.</p>
          </div>
          <ChevronRight size={15} />
        </div>
        <button className="user-switch" onClick={onSignOut}>
          <span className="avatar avatar-user">
            {displayName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span>
            <strong>{displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <MoreHorizontal size={17} />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ onMenu, role }: { onMenu: () => void; role: Role }) {
  const workspaceLabel =
    role === "learner" ? "Learner workspace" : role === "assessor" ? "Assessor workspace" : "Institution workspace";
  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div className="breadcrumb">
        <span>AERS</span>
        <ChevronRight size={14} />
        <strong>{workspaceLabel}</strong>
      </div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input placeholder="Search workspace" aria-label="Search workspace" />
        </label>
        <button
          className="icon-button notification-button"
          onClick={() => toast("You are all caught up.")}
          aria-label="Notifications"
        >
          <Inbox size={18} />
          <span />
        </button>
        <button className="top-avatar" onClick={() => toast("Profile menu opened.")} aria-label="User profile">
          A
        </button>
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  note,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  accent: string;
  icon: typeof Activity;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon metric-${accent}`}>
        <Icon size={18} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

function JourneyRail({ active = "Practise" }: { active?: string }) {
  const steps = ["Assess", "Learn", "Practise", "Evidence", "Review", "Verify"];
  return (
    <div className="journey-rail" aria-label="AERS journey progress">
      {steps.map((step, index) => (
        <div
          className={`journey-step ${steps.indexOf(active) >= index ? "journey-step-active" : ""}`}
          key={step}
        >
          <span>{steps.indexOf(active) > index ? <Check size={12} /> : index + 1}</span>
          <small>{step}</small>
          {index < steps.length - 1 ? <i aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

function WorkspaceState({ loading, error, emptyMessage }: { loading: boolean; error: string | null; emptyMessage: string }) {
  if (loading)
    return (
      <div className="workspace-state">
        <div className="state-spinner" />
        <p className="eyebrow">AERS Workspace</p>
        <h2>Loading your workspace</h2>
        <p>Your secure, role-scoped data is on its way.</p>
      </div>
    );
  if (error)
    return (
      <div className="workspace-state workspace-state-error">
        <div className="placeholder-icon">
          <Info size={23} />
        </div>
        <p className="eyebrow">AERS Workspace</p>
        <h2>We couldn't load this workspace</h2>
        <p>{error}</p>
      </div>
    );
  return (
    <div className="workspace-state">
      <div className="placeholder-icon">
        <Layers3 size={23} />
      </div>
      <p className="eyebrow">AERS Workspace</p>
      <h2>No programme data yet</h2>
      <p>{emptyMessage}</p>
    </div>
  );
}

function LearnerHome({
  setActive,
  workspace,
  loading,
  error,
  displayName,
}: {
  setActive: (value: string) => void;
  workspace: LearnerWorkspace | null;
  loading: boolean;
  error: string | null;
  displayName: string;
}) {
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [nextActionDone, setNextActionDone] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  if (loading || error || !workspace || workspace.weeks.length === 0)
    return (
      <WorkspaceState
        loading={loading}
        error={error}
        emptyMessage="Your institution has not attached a live programme enrolment to this account yet."
      />
    );

  const domains = workspace.domains;
  const evidenceItems = workspace.evidence;
  const programmeWeeks = workspace.weeks.map((week) => ({
    ...week,
    color:
      week.state === "Complete"
        ? "complete"
        : week.state === "In progress"
        ? "progress"
        : week.state === "Next up"
        ? "next"
        : "locked",
  }));
  const visibleWeeks = showAllWeeks ? programmeWeeks : programmeWeeks.slice(0, 5);
  const overallProgress = Math.round(
    programmeWeeks.reduce((sum, week) => sum + week.progress, 0) / programmeWeeks.length
  );
  const approvedCount = evidenceItems.filter((item) => item.status === "APPROVED").length;
  const reviewCount = evidenceItems.filter((item) =>
    ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"].includes(item.status)
  ).length;
  const revisionCount = evidenceItems.filter((item) => item.status === "REVISION_REQUIRED").length;
  const verifiedCount = evidenceItems.filter((item) => item.status === "APPROVED").length;
  const latestEvidence = evidenceItems[0];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Learner pathway</p>
          <h1>
            Good morning, {displayName.split(" ")[0]}
            <span className="heading-period">.</span>
          </h1>
          <p className="page-subtitle">Your next verified step is ready when you are.</p>
        </div>
        <button className="secondary-button guide-trigger" onClick={() => toast("Journey guide opened.")}>
          <Info size={16} />
          How AERS works
        </button>
      </div>

      <JourneyRail active={nextActionDone ? "Evidence" : "Practise"} />

      <section className="hero-grid">
        <div className="next-action-card">
          <div className="card-kicker">
            <span className="kicker-icon">
              <Target size={15} />
            </span>
            YOUR NEXT ACTION
          </div>
          <h2>{nextActionDone ? "Communication evidence is ready" : "Finish the communication practice"}</h2>
          <p>
            {nextActionDone
              ? "Your activity is complete. Submit the evidence when your recording is ready."
              : "Complete the final practice in Week 2 so you can move from practice to verified evidence."}
          </p>
          <div className="action-meta">
            <span>
              <Clock3 size={14} />
              10–15 min
            </span>
            <span>
              <FileText size={14} />
              Evidence required
            </span>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setNextActionDone(true);
              toast("Activity marked complete. Your evidence task is now open.");
            }}
          >
            {nextActionDone ? "Open evidence task" : "Continue activity"}
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="readiness-card">
          <div className="card-title-row">
            <div>
              <p className="eyebrow">Readiness snapshot</p>
              <h3>Your profile is taking shape</h3>
            </div>
            <button className="text-button" onClick={() => setActive("ERI profile")}>
              View ERI <ArrowRight size={14} />
            </button>
          </div>
          <div className="readiness-grid">
            {domains.slice(0, 3).map((domain) => (
              <div className="domain-row" key={domain.name}>
                <div className="domain-label">
                  <span>{domain.name}</span>
                  <strong>{domain.label}</strong>
                </div>
                <ProgressBar value={domain.value} tone={domain.tone} />
                <div className="domain-value">{domain.value}%</div>
              </div>
            ))}
          </div>
          <div className="preliminary-note">
            <Sparkles size={14} />
            Preliminary profile · based on assessment and activity data
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <MetricCard
          label="Programme progress"
          value={`${overallProgress}%`}
          note={`${programmeWeeks.length} weeks in your live pathway`}
          accent="blue"
          icon={BookOpen}
        />
        <MetricCard
          label="Evidence status"
          value={`${approvedCount} approved`}
          note={`${reviewCount} awaiting review · ${revisionCount} revision`}
          accent="teal"
          icon={FileCheck2}
        />
        <MetricCard
          label="Latest feedback"
          value={evidenceItems.length ? `${evidenceItems.length} tracked` : "None yet"}
          note="Feedback stays attached to its version"
          accent="amber"
          icon={MessageSquareText}
        />
        <MetricCard
          label="Verified evidence"
          value={`${verifiedCount} items`}
          note="Human-reviewed and approved"
          accent="coral"
          icon={ShieldCheck}
        />
      </section>

      <section className="content-grid">
        <div className="panel programme-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Your programme</p>
              <h2>{workspace.programmeName}</h2>
            </div>
            <button className="text-button" onClick={() => setActive("Programme")}>
              Open programme <ArrowRight size={14} />
            </button>
          </div>
          <div className="overall-progress">
            <div>
              <span>Overall progress</span>
              <strong>{overallProgress}%</strong>
            </div>
            <ProgressBar value={overallProgress} />
            <div className="progress-meta">
              <span>{programmeWeeks.filter((week) => week.state === "Complete").length} completed weeks</span>
              <span>{programmeWeeks.length} published weeks</span>
            </div>
          </div>
          <div className="week-list">
            {visibleWeeks.map((week) => (
              <button
                key={week.number}
                className={`week-row ${week.color === "locked" ? "week-locked" : ""}`}
                onClick={() =>
                  week.color === "locked"
                    ? toast("This week unlocks as you complete the current programme steps.")
                    : setActive("Programme")
                }
                aria-disabled={week.color === "locked"}
              >
                <span className={`week-number week-${week.color}`}>
                  {week.color === "complete" ? (
                    <Check size={16} />
                  ) : week.color === "locked" ? (
                    <ShieldCheck size={15} />
                  ) : (
                    week.number
                  )}
                </span>
                <span className="week-copy">
                  <strong>
                    Week {week.number} · {week.title}
                  </strong>
                  <small>{week.state}{week.progress > 0 ? ` · ${week.progress}% complete` : ""}</small>
                </span>
                {week.progress > 0 && week.progress < 100 ? (
                  <span className="week-progress">
                    <ProgressBar value={week.progress} tone="blue" />
                  </span>
                ) : null}
                <ChevronRight size={16} className="week-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
          <button className="show-more" onClick={() => setShowAllWeeks(!showAllWeeks)}>
            {showAllWeeks ? "Show less" : `View all ${workspace.durationWeeks} weeks`}
            <ChevronDown size={15} className={showAllWeeks ? "rotate-up" : ""} />
          </button>
        </div>

        <div className="panel feedback-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent feedback</p>
              <h2>Human review, made useful</h2>
            </div>
            <button className="text-button" onClick={() => setActive("Feedback")}>
              View feedback <ArrowRight size={14} />
            </button>
          </div>
          {latestEvidence ? (
            <div className="feedback-highlight">
              <div className="reviewer-row">
                <span className="avatar avatar-reviewer">
                  <ShieldCheck size={15} />
                </span>
                <span>
                  <strong>Latest evidence</strong>
                  <small>{latestEvidence.submitted}</small>
                </span>
                <StatusBadge status={latestEvidence.status} />
              </div>
              <p>{latestEvidence.detail}</p>
              <button className="outline-button" onClick={() => setActive("Evidence")}>
                View evidence <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <MessageSquareText size={21} />
              <h3>No feedback yet</h3>
              <p>Assessor feedback will appear here after your first evidence submission is reviewed.</p>
            </div>
          )}
          <div className="verified-callout">
            <ShieldCheck size={18} />
            <div>
              <strong>Human verification matters</strong>
              <p>Only an authorised assessor can approve evidence or update your verified ERI profile.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel evidence-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Evidence at a glance</p>
            <h2>Your work, with a clear trail</h2>
          </div>
          <button className="text-button" onClick={() => setActive("Evidence")}>
            View all evidence <ArrowRight size={14} />
          </button>
        </div>
        <div className="evidence-table">
          <div className="evidence-table-head">
            <span>Activity</span>
            <span>Domain</span>
            <span>Version</span>
            <span>Status</span>
            <span>Submitted</span>
            <span />
          </div>
          {evidenceItems.slice(0, 3).map((item) => (
            <button className="evidence-row" key={item.id} onClick={() => setSelectedEvidence(item)}>
              <span className="evidence-title">
                <span className="file-icon">
                  <FileText size={16} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.domain}</small>
                </span>
              </span>
              <span>{item.domain}</span>
              <span className="version-label">{item.version}</span>
              <StatusBadge status={item.status} />
              <span className="submitted-label">{item.submitted}</span>
              <ChevronRight size={16} className="week-chevron" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {selectedEvidence ? <EvidenceDrawer item={selectedEvidence} onClose={() => setSelectedEvidence(null)} /> : null}
    </>
  );
}

function EvidenceDrawer({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="evidence-drawer" onClick={(event) => event.stopPropagation()} aria-label="Evidence details">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Evidence detail</p>
            <h2>{item.title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close evidence detail">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-status">
          <StatusBadge status={item.status} />
          <span>
            {item.version} · {item.submitted}
          </span>
        </div>
        <div className="timeline">
          <div className="timeline-item timeline-done">
            <span>
              <Check size={14} />
            </span>
            <div>
              <strong>Activity completed</strong>
              <small>Week 2 · Professional communication</small>
            </div>
          </div>
          <div className="timeline-item timeline-done">
            <span>
              <Check size={14} />
            </span>
            <div>
              <strong>{item.version === "v2" ? "Revision submitted" : "Evidence submitted"}</strong>
              <small>{item.submitted}</small>
            </div>
          </div>
          <div className={`timeline-item ${item.status === "Approved" ? "timeline-done" : "timeline-current"}`}>
            <span>{item.status === "Approved" ? <Check size={14} /> : <Clock3 size={14} />}</span>
            <div>
              <strong>{item.status === "Approved" ? "Human verified" : "Awaiting assessor review"}</strong>
              <small>{item.status === "Approved" ? item.reviewer : "Next step in the evidence workflow"}</small>
            </div>
          </div>
        </div>
        <div className="drawer-section">
          <p className="eyebrow">Assessor feedback</p>
          <p className="drawer-feedback">{item.detail}</p>
        </div>
        <div className="drawer-file">
          <FileText size={18} />
          <div>
            <strong>professional-introduction.mp4</strong>
            <small>MP4 · 18.4 MB · uploaded securely</small>
          </div>
          <button className="text-button" onClick={() => toast("Secure preview would open here.")}>
            Preview
          </button>
        </div>
        {item.status === "Revision required" ? (
          <button className="primary-button drawer-cta" onClick={() => toast("Revision flow opened.")}>
            Create revision <ArrowRight size={16} />
          </button>
        ) : (
          <button className="outline-button drawer-cta" onClick={() => toast("Evidence receipt opened.")}>
            View submission receipt <ArrowRight size={16} />
          </button>
        )}
      </aside>
    </div>
  );
}

function ProgrammeView({
  setActive,
  workspace,
  loading,
  error,
}: {
  setActive: (value: string) => void;
  workspace: LearnerWorkspace | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading || error || !workspace || workspace.weeks.length === 0)
    return (
      <WorkspaceState
        loading={loading}
        error={error}
        emptyMessage="Your institution has not attached a live programme enrolment to this account yet."
      />
    );

  const currentWeek =
    workspace.weeks.find((week) => week.state === "In progress" || week.state === "Next up") ?? workspace.weeks[0];
  const averageProgress = Math.round(
    workspace.weeks.reduce((sum, week) => sum + week.progress, 0) / workspace.weeks.length
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Learning pathway</p>
          <h1>Programme map</h1>
          <p className="page-subtitle">
            A focused {workspace.durationWeeks}-week journey from assessment to human-verified evidence.
          </p>
        </div>
        <button className="primary-button" onClick={() => setActive("Home")}>
          <HomeIcon size={16} />
          Back to home
        </button>
      </div>

      <JourneyRail active="Learn" />

      <section className="programme-hero panel">
        <div>
          <p className="eyebrow">Currently in</p>
          <h2>
            Week {currentWeek.number} · {currentWeek.title}
          </h2>
          <p>{currentWeek.description ?? "Your institution's programme content will appear here as it is published."}</p>
          <div className="hero-meta">
            <span>
              <Check size={14} />
              {currentWeek.progress}% week progress
            </span>
            <span>
              <Activity size={14} />
              {workspace.weeks.length} weeks loaded
            </span>
          </div>
        </div>
        <div className="programme-progress-ring">
          <strong>{averageProgress}%</strong>
          <span>programme progress</span>
        </div>
      </section>

      <div className="programme-columns">
        <section className="panel week-detail-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Published programme content</p>
              <h2>Progress by week</h2>
            </div>
            <button
              className="text-button"
              onClick={() => toast("Programme content is managed by your AERS institution administrator.")}
            >
              Content support <Info size={14} />
            </button>
          </div>
          {workspace.weeks.map((week) => (
            <button
              key={week.number}
              className={"week-row " + (week.state === "Locked" ? "week-locked" : "")}
              onClick={() =>
                week.state === "Locked"
                  ? toast("This week unlocks as you complete the current programme steps.")
                  : toast("Week " + week.number + " opened.")
              }
              aria-disabled={week.state === "Locked"}
            >
              <span
                className={
                  "week-number " +
                  (week.state === "Complete"
                    ? "week-complete"
                    : week.state === "Locked"
                    ? "week-locked"
                    : "week-next")
                }
              >
                {week.state === "Complete" ? (
                  <Check size={16} />
                ) : week.state === "Locked" ? (
                  <ShieldCheck size={15} />
                ) : (
                  week.number
                )}
              </span>
              <span className="week-copy">
                <strong>
                  Week {week.number} · {week.title}
                </strong>
                <small>{week.state}{week.progress > 0 ? " · " + week.progress + "% complete" : ""}</small>
              </span>
              <ChevronRight size={16} className="week-chevron" aria-hidden="true" />
            </button>
          ))}
        </section>

        <section className="panel focus-panel">
          <p className="eyebrow">Why this matters</p>
          <h2>Employability is built in public.</h2>
          <p>Each practice becomes evidence you can improve, submit, and have reviewed by a human assessor.</p>
          <div className="focus-stat">
            <span>Evidence trail</span>
            <strong>
              Activity <ArrowRight size={13} /> Version <ArrowRight size={13} /> Review <ArrowRight size={13} /> Verified
            </strong>
          </div>
          <button className="outline-button" onClick={() => setActive("Evidence")}>
            Open evidence library <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </>
  );
}

function EvidenceView({
  setActive,
  workspace,
  loading,
  error,
}: {
  setActive: (value: string) => void;
  workspace: LearnerWorkspace | null;
  loading: boolean;
  error: string | null;
}) {
  const [filter, setFilter] = useState("All evidence");
  const [selected, setSelected] = useState<EvidenceItem | null>(null);

  if (loading || error || !workspace)
    return (
      <WorkspaceState
        loading={loading}
        error={error}
        emptyMessage="Evidence will appear here after you complete an activity and submit a version."
      />
    );

  const evidenceItems = workspace.evidence;
  const filtered =
    filter === "All evidence"
      ? evidenceItems
      : evidenceItems.filter((item) => item.status.replaceAll("_", " ").toLowerCase() === filter.toLowerCase());
  const approved = evidenceItems.filter((item) => item.status === "APPROVED").length;
  const underReview = evidenceItems.filter((item) =>
    ["UNDER_REVIEW", "SUBMITTED", "RESUBMITTED"].includes(item.status)
  ).length;
  const revisions = evidenceItems.filter((item) => item.status === "REVISION_REQUIRED").length;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Traceable work</p>
          <h1>Evidence library</h1>
          <p className="page-subtitle">Every submission carries its own history, review, and verification trail.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => toast("Choose a published activity with an evidence task to start a submission.")}
        >
          <Plus size={17} />
          New submission
        </button>
      </div>

      <section className="evidence-overview">
        <div className="overview-intro">
          <span className="large-shield">
            <ShieldCheck size={25} />
          </span>
          <div>
            <h2>Evidence is more than an attachment.</h2>
            <p>It is the bridge between what you practise and what an authorised assessor can verify.</p>
          </div>
        </div>
        <div className="evidence-counts">
          <div>
            <strong>{approved}</strong>
            <span>Approved</span>
          </div>
          <div>
            <strong>{underReview}</strong>
            <span>Under review</span>
          </div>
          <div>
            <strong>{revisions}</strong>
            <span>Revision required</span>
          </div>
        </div>
      </section>

      <div className="filter-row">
        <div className="filter-tabs">
          {["All evidence", "Approved", "Under review", "Revision required"].map((name) => (
            <button key={name} className={filter === name ? "filter-active" : ""} onClick={() => setFilter(name)}>
              {name}
            </button>
          ))}
        </div>
        <button
          className="filter-button"
          onClick={() => toast("Additional filters are ready for programme, week, and activity.")}
        >
          <Filter size={15} />
          Filters
        </button>
      </div>

      <section className="panel evidence-library-panel">
        {filtered.length ? (
          filtered.map((item) => (
            <button className="library-row" key={item.id} onClick={() => setSelected(item)}>
              <div className="library-main">
                <span className="file-icon file-icon-large">
                  <FileText size={20} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.domain}</p>
                </div>
              </div>
              <div className="library-version">
                <span>Current version</span>
                <strong>{item.version}</strong>
              </div>
              <StatusBadge status={item.status} />
              <div className="library-date">
                <span>Last activity</span>
                <strong>{item.submitted}</strong>
              </div>
              <ChevronRight size={18} className="week-chevron" aria-hidden="true" />
            </button>
          ))
        ) : (
          <div className="empty-state">
            <FileCheck2 size={23} />
            <h3>No evidence in this view</h3>
            <p>Complete a published activity with an evidence task to create your first submission.</p>
          </div>
        )}
      </section>

      {selected ? <EvidenceDrawer item={selected} onClose={() => setSelected(null)} /> : null}

      <button className="back-link" onClick={() => setActive("Home")}>
        <ArrowRight size={15} className="back-arrow" />
        Back to learner home
      </button>
    </>
  );
}

function EriView({
  workspace,
  loading,
  error,
}: {
  workspace: LearnerWorkspace | null;
  loading: boolean;
  error: string | null;
}) {
  const [expanded, setExpanded] = useState("");

  if (loading || error || !workspace || workspace.domains.length === 0)
    return (
      <WorkspaceState
        loading={loading}
        error={error}
        emptyMessage="Your ERI profile will appear after the baseline assessment or verified evidence is recorded."
      />
    );

  const domains = workspace.domains;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Explainable readiness</p>
          <h1>ERI profile</h1>
          <p className="page-subtitle">
            A domain profile grounded in assessment, activity progress, and human-verified evidence.
          </p>
        </div>
        <div className="profile-label">
          <span className="profile-label-dot" />
          Preliminary profile
        </div>
      </div>

      <section className="eri-banner panel">
        <div>
          <p className="eyebrow">Employment readiness profile</p>
          <h2>See where your evidence is building momentum.</h2>
          <p>
            This profile is not an employment probability or guarantee. Verified levels only change when an authorised
            assessor approves evidence.
          </p>
        </div>
        <div className="eri-summary">
          <strong>{domains.length}</strong>
          <span>domains tracked</span>
          <small>{domains.filter((domain) => domain.status === "VERIFIED").length} with human-verified evidence</small>
        </div>
      </section>

      <section className="panel eri-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Domain breakdown</p>
            <h2>Preliminary vs verified</h2>
          </div>
          <button className="text-button" onClick={() => toast("ERI methodology notes opened.")}>
            <Info size={15} />
            How this works
          </button>
        </div>
        {domains.map((domain) => (
          <div className={"eri-domain " + (expanded === domain.name ? "eri-expanded" : "")} key={domain.name}>
            <button
              className="eri-domain-header"
              onClick={() => setExpanded(expanded === domain.name ? "" : domain.name)}
            >
              <div className={"eri-domain-badge badge-" + domain.tone}>
                <BarChart3 size={17} />
              </div>
              <div className="eri-domain-name">
                <strong>{domain.name}</strong>
                <span>
                  {domain.label} · {domain.status}
                </span>
              </div>
              <div className="eri-domain-score">
                <strong>{domain.value}%</strong>
                <ProgressBar value={domain.value} tone={domain.tone} />
              </div>
              <ChevronDown size={17} />
            </button>
            {expanded === domain.name ? (
              <div className="eri-detail">
                <div>
                  <span>Current profile level</span>
                  <strong>{domain.label}</strong>
                  <small>Calculated from data the backend has recorded for this domain.</small>
                </div>
                <div>
                  <span>Verified evidence</span>
                  <strong>{domain.status === "VERIFIED" ? "Available" : "Not yet available"}</strong>
                  <small>
                    {domain.status === "VERIFIED"
                      ? "Supported by approved assessor review"
                      : "Submit and improve evidence to build this domain"}
                  </small>
                </div>
                <div>
                  <span>Next opportunity</span>
                  <strong>Complete the next programme activity</strong>
                  <small>Recommendations remain traceable to your programme pathway.</small>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </section>
    </>
  );
}

function AssessorDashboard({
  setActive,
  reviews,
  loading,
  error,
}: {
  setActive: (value: string) => void;
  reviews: AssessorReview[];
  loading: boolean;
  error: string | null;
}) {
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [decision, setDecision] = useState("");
  const [feedback, setFeedback] = useState("");
  const [criteria, setCriteria] = useState<Array<{ id: string; name: string }>>([]);
  const [scores, setScores] = useState<Record<string, number>>({
    Clarity: 3,
    Structure: 3,
    Specificity: 3,
    Professionalism: 3,
  });
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);

  const openReview = async (review: AssessorReview) => {
    setSelectedReview(review);
    setDecision("");
    setFeedback("");
    if (!supabase || !review.rubricId) {
      setCriteria([]);
      return;
    }
    const { data, error: criteriaError } = await supabase
      .from("rubric_criteria")
      .select("id,name")
      .eq("rubric_id", review.rubricId)
      .order("sequence");
    if (criteriaError) {
      toast("We couldn't load the rubric. Please try again.");
      return;
    }
    const nextCriteria = (data ?? []) as Array<{ id: string; name: string }>;
    setCriteria(nextCriteria);
    setScores(Object.fromEntries(nextCriteria.map((criterion) => [criterion.name, 3])));
  };

  const submitReview = async () => {
    if (!decision || !selectedReview?.submissionVersionId || !supabase)
      return toast("Choose a decision before submitting the review.");
    if (decision === "Revision required" && feedback.trim().length < 10)
      return toast("Add specific feedback so the learner knows what to improve.");
    const { error: reviewError } = await supabase.rpc("submit_review", {
      p_submission_version_id: selectedReview.submissionVersionId,
      p_decision: decision === "Approved" ? "APPROVED" : "REVISION_REQUIRED",
      p_overall_feedback: feedback.trim() || null,
      p_scores: criteria.map((criterion) => ({
        criterion_id: criterion.id,
        score: scores[criterion.name] ?? 0,
        comment: null,
      })),
    });
    if (reviewError) {
      console.error("[AERS] Review submission failed", reviewError);
      toast("We couldn't submit this review. Please check the rubric and try again.");
      return;
    }
    toast(
      decision === "Approved"
        ? "Review saved. Evidence is now human verified."
        : "Revision requested. Learner notification queued."
    );
    setSelectedReview(null);
  };

  if (loading || error || reviews.length === 0)
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Assessor workspace</p>
            <h1>Review queue</h1>
            <p className="page-subtitle">Make the next decision clear, constructive, and traceable.</p>
          </div>
        </div>
        <WorkspaceState
          loading={loading}
          error={error}
          emptyMessage="No review assignments are currently visible for this assessor."
        />
      </>
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Assessor workspace</p>
          <h1>Review queue</h1>
          <p className="page-subtitle">Make the next decision clear, constructive, and traceable.</p>
        </div>
        <div className="assessor-identity">
          <span className="avatar avatar-reviewer">VR</span>
          <div>
            <strong>Authorised assessor</strong>
            <small>Human verification role</small>
          </div>
        </div>
      </div>

      <section className="stats-grid assessor-stats">
        <MetricCard label="Pending reviews" value={String(reviews.length)} note="Assigned to you" accent="blue" icon={Inbox} />
        <MetricCard
          label="Revision cases"
          value={String(reviews.filter((review) => review.status.includes("REVISION")).length)}
          note="Needs follow-up"
          accent="amber"
          icon={MessageSquareText}
        />
        <MetricCard
          label="Assigned today"
          value={String(reviews.filter((review) => review.submitted === new Date().toLocaleDateString()).length)}
          note="From live queue"
          accent="teal"
          icon={Check}
        />
        <MetricCard
          label="High priority"
          value={String(reviews.filter((review) => review.priority === "High").length)}
          note="Past due"
          accent="coral"
          icon={Clock3}
        />
      </section>

      <section className="panel queue-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">My reviews</p>
            <h2>Evidence awaiting a human decision</h2>
          </div>
          <div className="queue-actions">
            <button className="filter-button" onClick={() => toast("Queue filters opened.")}>
              <Filter size={15} />
              Filter
            </button>
            <button className="icon-button" onClick={() => toast("Queue search opened.")} aria-label="Search reviews">
              <Search size={17} />
            </button>
          </div>
        </div>
        <div className="queue-table">
          <div className="queue-table-head">
            <span>Learner / activity</span>
            <span>Submitted</span>
            <span>Priority</span>
            <span>Status</span>
            <span />
          </div>
          {reviews.map((review) => (
            <button className="queue-row" key={review.id} onClick={() => openReview(review)}>
              <span className="queue-learner">
                <span className="avatar avatar-small">
                  {review.learner
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </span>
                <span>
                  <strong>{review.learner}</strong>
                  <small>
                    {review.activity} · {review.cohort}
                  </small>
                </span>
              </span>
              <span>{review.submitted}</span>
              <span className={review.priority === "High" ? "priority-high" : "priority-normal"}>
                {review.priority}
              </span>
              <StatusBadge status={review.status} />
              <ArrowRight size={16} className="week-chevron" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="assessor-bottom-grid">
        <div className="panel assessor-insight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Review quality</p>
              <h2>Consistency helps learners improve.</h2>
            </div>
            <BarChart3 size={20} className="muted-icon" />
          </div>
          <div className="review-quality">
            <div className="quality-score">
              <strong>Live queue</strong>
              <span>Rubric scores are saved through Supabase RPCs</span>
            </div>
            <div className="quality-bars">
              <div>
                <div>
                  <span>Assigned evidence</span>
                  <strong>{reviews.length}</strong>
                </div>
                <ProgressBar value={100} tone="blue" />
              </div>
            </div>
          </div>
        </div>

        <div className="panel assessor-note">
          <div className="note-icon">
            <ShieldCheck size={20} />
          </div>
          <p className="eyebrow">Human verification standard</p>
          <h2>AI can assist. You decide.</h2>
          <p>Only an authorised assessor can approve evidence, update verified ERI, or make a final competency decision.</p>
          <button className="text-button" onClick={() => toast("Assessor standards opened.")}>
            Read the standard <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {selectedReview ? (
        <ReviewDrawer
          review={selectedReview}
          decision={decision}
          setDecision={setDecision}
          feedback={feedback}
          setFeedback={setFeedback}
          scores={scores}
          setScores={setScores}
          total={total}
          onClose={() => setSelectedReview(null)}
          onSubmit={submitReview}
        />
      ) : null}

      <button className="back-link" onClick={() => setActive("Home")}>
        <ArrowRight size={15} className="back-arrow" />
        Return to workspace home
      </button>
    </>
  );
}

function ReviewDrawer({
  review,
  decision,
  setDecision,
  feedback,
  setFeedback,
  scores,
  setScores,
  total,
  onClose,
  onSubmit,
}: {
  review: ReviewItem;
  decision: string;
  setDecision: (value: string) => void;
  feedback: string;
  setFeedback: (value: string) => void;
  scores: Record<string, number>;
  setScores: (scores: Record<string, number>) => void;
  total: number;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="review-drawer" onClick={(event) => event.stopPropagation()} aria-label="Review submission drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Reviewing submission</p>
            <h2>{review.activity}</h2>
            <p className="drawer-subtitle">
              {review.learner} · {review.cohort}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close review">
            <X size={18} />
          </button>
        </div>
        <div className="review-split">
          <div className="evidence-preview">
            <div className="preview-toolbar">
              <span>
                <FileText size={15} />
                Evidence preview
              </span>
              <button onClick={() => toast("Secure evidence preview opened.")}>Open file</button>
            </div>
            <div className="preview-canvas">
              <div className="preview-doc-icon">
                <UploadCloud size={28} />
              </div>
              <strong>professional-introduction.mp4</strong>
              <span>Secure preview · 18.4 MB</span>
              <button className="preview-play" onClick={() => toast("Preview playback started.")}>
                Preview evidence
              </button>
            </div>
            <div className="version-strip">
              <span>Version history</span>
              <button className="version-chip version-chip-current">v2 · current</button>
              <button className="version-chip">v1 · revision requested</button>
            </div>
          </div>
          <div className="review-form">
            <div className="rubric-header">
              <div>
                <p className="eyebrow">Communication rubric · v1.0</p>
                <h3>Score the current version</h3>
              </div>
              <span className="rubric-total">{total}/20</span>
            </div>
            {Object.keys(scores).map((criterion) => (
              <div className="criterion" key={criterion}>
                <div>
                  <strong>{criterion}</strong>
                  <small>
                    {criterion === "Clarity"
                      ? "Ideas are easy to understand"
                      : criterion === "Structure"
                      ? "Response has a clear beginning, middle, and end"
                      : criterion === "Authenticity"
                      ? "Examples feel specific and owned"
                      : "Tone is appropriate for the workplace"}
                  </small>
                </div>
                <div className="score-row">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      className={scores[criterion] === score ? "score-active" : ""}
                      onClick={() => setScores({ ...scores, [criterion]: score })}
                      aria-label={`Score ${score} for ${criterion}`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <label className="field-label">
              Feedback <span>{decision === "Revision required" ? "Required for a revision request" : "Optional"}</span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Share specific, actionable feedback for the learner…"
              />
            </label>
            <div className="decision-label">Decision</div>
            <div className="decision-options">
              <button
                className={decision === "Approved" ? "decision-active decision-approve" : ""}
                onClick={() => setDecision("Approved")}
              >
                <Check size={15} />
                Approve evidence
              </button>
              <button
                className={decision === "Revision required" ? "decision-active decision-revise" : ""}
                onClick={() => setDecision("Revision required")}
              >
                <MessageSquareText size={15} />
                Request revision
              </button>
            </div>
            <button className="primary-button review-submit" onClick={onSubmit}>
              <Send size={16} />
              Submit review
            </button>
            <p className="review-disclaimer">
              <ShieldCheck size={14} />
              Your decision is recorded in the audit trail and the learner will be notified.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function StaffDashboard({
  summary,
  loading,
  error,
}: {
  summary: StaffWorkspace | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading || error || !summary)
    return (
      <WorkspaceState
        loading={loading}
        error={error}
        emptyMessage="Your role-scoped institution summary will appear here when data is available."
      />
    );

  const roleName =
    summary.role === "AERS_ADMIN"
      ? "Platform administration"
      : summary.role === "INSTITUTION_LEADERSHIP"
      ? "Leadership overview"
      : summary.role === "FACILITATOR"
      ? "Facilitator workspace"
      : "Institution coordination";

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Role-scoped operations</p>
          <h1>{roleName}</h1>
          <p className="page-subtitle">Live counts from the Supabase-backed AERS institution and programme scope.</p>
        </div>
        <div className="profile-label">
          <span className="profile-label-dot" />
          {summary.role.replaceAll("_", " ")}
        </div>
      </div>

      <section className="stats-grid">
        <MetricCard label="Institutions visible" value={String(summary.institutionCount)} note="RLS-scoped records" accent="blue" icon={HomeIcon} />
        <MetricCard label="Cohorts visible" value={String(summary.cohortCount)} note="Programme groupings" accent="teal" icon={UsersRound} />
        <MetricCard label="Learners visible" value={String(summary.learnerCount)} note="Accessible profiles" accent="amber" icon={UsersRound} />
        <MetricCard
          label="Pending evidence"
          value={String(summary.pendingEvidenceCount)}
          note="Across your permitted scope"
          accent="coral"
          icon={FileCheck2}
        />
      </section>

      <section className="content-grid">
        <div className="panel feedback-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Security model</p>
              <h2>Access follows your role.</h2>
            </div>
            <ShieldCheck size={20} className="muted-icon" />
          </div>
          <p className="panel-copy">
            Every count is queried through Supabase Row-Level Security. The client does not decide which institution,
            cohort, learner, or submission a staff member may access.
          </p>
          <div className="verified-callout">
            <ShieldCheck size={18} />
            <div>
              <strong>RLS-protected workspace</strong>
              <p>Role checks and tenant boundaries are enforced by database policies and security-definer functions.</p>
            </div>
          </div>
        </div>

        <div className="panel focus-panel">
          <p className="eyebrow">Next operations</p>
          <h2>Use the institution tools.</h2>
          <p>
            Open cohorts, reports, or programme administration from the role-aware navigation to continue working with
            live records.
          </p>
        </div>
      </section>
    </>
  );
}

function AppContent() {
  const { authUser, profile, roles, signOut } = useSupabaseAuth();
  const primaryRole: AersRoleCode = roles.some((item) => item.code === "ASSESSOR")
    ? "ASSESSOR"
    : roles[0]?.code ?? "LEARNER";
  const role: Role = primaryRole === "ASSESSOR" ? "assessor" : primaryRole === "LEARNER" ? "learner" : "staff";
  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "AERS member";
  const roleLabel =
    roles[0]?.name ?? (role === "assessor" ? "Human assessor" : role === "learner" ? "Learner" : "Institution staff");
  const { workspace, reviews, staffSummary, loading: workspaceLoading, error: workspaceError } = useAersWorkspace(
    authUser?.id ?? null,
    primaryRole
  );
  const [active, setActive] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    void signOut().catch(() => toast("We couldn't sign you out. Please try again."));
  };

  const content = useMemo(() => {
    if (role === "assessor")
      return <AssessorDashboard setActive={setActive} reviews={reviews} loading={workspaceLoading} error={workspaceError} />;
    if (role === "staff")
      return <StaffDashboard summary={staffSummary} loading={workspaceLoading} error={workspaceError} />;
    if (active === "Programme")
      return <ProgrammeView setActive={setActive} workspace={workspace} loading={workspaceLoading} error={workspaceError} />;
    if (active === "Evidence")
      return <EvidenceView setActive={setActive} workspace={workspace} loading={workspaceLoading} error={workspaceError} />;
    if (active === "ERI profile")
      return <EriView workspace={workspace} loading={workspaceLoading} error={workspaceError} />;
    if (active !== "Home")
      return <PlaceholderView title={active} setActive={setActive} />;
    return (
      <LearnerHome
        setActive={setActive}
        workspace={workspace}
        loading={workspaceLoading}
        error={workspaceError}
        displayName={displayName}
      />
    );
  }, [active, role, reviews, staffSummary, workspace, workspaceError, workspaceLoading, displayName]);

  return (
    <div className="app-shell">
      <div className={mobileOpen ? "sidebar mobile-visible" : "sidebar-wrap"}>
        <Sidebar
          active={active}
          setActive={(value) => {
            setActive(value);
            setMobileOpen(false);
          }}
          role={role}
          displayName={displayName}
          roleLabel={roleLabel}
          onSignOut={handleSignOut}
          reviewCount={reviews.length}
        />
      </div>
      {mobileOpen ? (
        <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      ) : null}
      <div className="main-shell">
        <Topbar onMenu={() => setMobileOpen(true)} role={role} />
        <main className="main-content">{content}</main>
        <footer className="app-footer">
          <span>© 2026 AERS · ASV Employment Readiness Standard</span>
          <span>
            <ShieldCheck size={14} />
            Your data is private and access is role-controlled
          </span>
        </footer>
      </div>
    </div>
  );
}

function PlaceholderView({ title, setActive }: { title: string; setActive: (value: string) => void }) {
  return (
    <div className="placeholder-view">
      <div className="placeholder-icon">
        <Layers3 size={24} />
      </div>
      <p className="eyebrow">AERS Workspace</p>
      <h1>{title}</h1>
      <p>
        This area is connected to the AERS workflow and ready for the next content pack. The learner path stays focused
        on one clear next action.
      </p>
      <button className="primary-button" onClick={() => setActive("Home")}>
        <HomeIcon size={16} />
        Back to home
      </button>
    </div>
  );
}

export default function Home() {
  return <AppContent />;
}
