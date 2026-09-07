import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export default function AuthPage() {
  const { signIn, loading, error } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setFormError("Enter your email and password to continue.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (signInError) {
      setFormError(signInError instanceof Error ? signInError.message : "We couldn't sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="auth-art-inner">
          <div className="auth-brand"><span className="auth-brand-orbit" /><span className="auth-brand-dot" /><strong>AERS</strong></div>
          <div className="auth-art-copy">
            <p className="eyebrow">ASV EMPLOYMENT READINESS STANDARD</p>
            <h1>Make your readiness visible.</h1>
            <p>Assess where you are, practise what matters, and build evidence an authorised human assessor can verify.</p>
            <div className="auth-steps"><span><b>01</b>Assess</span><span><b>02</b>Practise</span><span><b>03</b>Verify</span></div>
          </div>
          <div className="auth-art-footer"><ShieldCheck size={16} /> Evidence-based · Human-reviewed · Institution-ready</div>
        </div>
      </div>
      <main className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-mobile-mark"><span className="auth-brand-orbit" /><span className="auth-brand-dot" /><strong>AERS</strong></div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to your workspace</h2>
            <p>Use the email address linked to your AERS invitation.</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>Email address
              <input type="email" autoComplete="email" placeholder="you@institution.edu" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>Password
              <div className="password-field">
                <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            {formError || error ? <div className="auth-error">{formError || error}</div> : null}
            <button className="primary-button auth-submit" type="submit" disabled={submitting || loading}>
              {submitting || loading ? <Loader2 size={16} className="spin" /> : <LockKeyhole size={16} />}
              {submitting ? "Signing in…" : "Sign in"}<ArrowRight size={16} />
            </button>
          </form>
          <div className="auth-note"><ShieldCheck size={16} /><span>Access is controlled by your assigned AERS role and institution. New accounts require an approved invitation.</span></div>
          <p className="auth-help">Need access? Contact your programme coordinator.</p>
        </div>
      </main>
    </div>
  );
}
