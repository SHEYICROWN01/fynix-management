import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, TrendingUp, Users, BarChart3, ArrowUpRight } from "lucide-react";
import { type ApiError } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading]       = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      toast("Login Successful", { description: "Welcome back, Super Admin!" });
      navigate("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Bar chart data — monthly tenant activity
  const bars = [
    { h: 38, label: "Jan" },
    { h: 52, label: "Feb" },
    { h: 44, label: "Mar" },
    { h: 68, label: "Apr" },
    { h: 58, label: "May" },
    { h: 80, label: "Jun" },
    { h: 72, label: "Jul" },
    { h: 90, label: "Aug", active: true },
    { h: 65, label: "Sep" },
    { h: 78, label: "Oct" },
    { h: 60, label: "Nov" },
    { h: 85, label: "Dec" },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fcl-root {
          min-height: 100svh;
          display: grid;
          grid-template-columns: 480px 1fr;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          background: #F2F4F8;
        }
        @media (max-width: 900px) {
          .fcl-root { grid-template-columns: 1fr; }
          .fcl-right { display: none; }
        }

        /* ─── LEFT PANEL ───────────────────────────────── */
        .fcl-left {
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 52px;
          position: relative;
          min-height: 100svh;
        }

        /* Logo */
        .fcl-logo {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 48px;
        }
        .fcl-logo-mark {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #2250CC 0%, #3B6FE8 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(34,80,204,0.30);
          flex-shrink: 0;
        }
        .fcl-logo-mark span {
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .fcl-logo-text {
          display: flex;
          flex-direction: column;
        }
        .fcl-logo-name {
          color: #0D1428;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }
        .fcl-logo-tag {
          color: #8A94B0;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* Heading */
        .fcl-heading {
          margin-bottom: 32px;
        }
        .fcl-heading h1 {
          font-size: 26px;
          font-weight: 700;
          color: #0D1428;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .fcl-heading p {
          font-size: 14px;
          color: #8A94B0;
        }

        /* Error */
        .fcl-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 20px;
        }
        .fcl-error svg { color: #EF4444; flex-shrink: 0; margin-top: 1px; }
        .fcl-error p { color: #DC2626; font-size: 13px; line-height: 1.45; }

        /* Form */
        .fcl-form { display: flex; flex-direction: column; gap: 18px; }

        .fcl-field { display: flex; flex-direction: column; gap: 7px; }
        .fcl-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fcl-label {
          font-size: 13px;
          font-weight: 600;
          color: #3A4460;
          letter-spacing: 0.01em;
        }
        .fcl-forgot {
          font-size: 12.5px;
          font-weight: 500;
          color: #2250CC;
          text-decoration: none;
          transition: color 0.12s;
        }
        .fcl-forgot:hover { color: #3B6FE8; }

        .fcl-input-wrap { position: relative; }
        .fcl-input {
          width: 100%;
          height: 46px;
          background: #F5F7FF;
          border: 1.5px solid #E4E9F5;
          border-radius: 10px;
          color: #0D1428;
          font-size: 14px;
          font-family: inherit;
          padding: 0 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .fcl-input:focus {
          background: #fff;
          border-color: #2250CC;
          box-shadow: 0 0 0 3.5px rgba(34,80,204,0.10);
        }
        .fcl-input:disabled { opacity: 0.55; cursor: not-allowed; }
        .fcl-input::placeholder { color: #B0B9D0; }
        .fcl-input.pr { padding-right: 46px; }
        .fcl-input:-webkit-autofill,
        .fcl-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #F5F7FF inset;
          -webkit-text-fill-color: #0D1428;
          caret-color: #0D1428;
        }

        .fcl-eye {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; padding: 4px;
          cursor: pointer; color: #B0B9D0; line-height: 0;
          transition: color 0.12s;
        }
        .fcl-eye:hover { color: #2250CC; }

        /* Remember */
        .fcl-remember {
          display: flex; align-items: center; gap: 9px; cursor: pointer;
        }
        .fcl-checkbox {
          width: 16px; height: 16px;
          accent-color: #2250CC; cursor: pointer; flex-shrink: 0;
          border-radius: 4px;
        }
        .fcl-remember span {
          font-size: 13px; color: #6B748E; cursor: pointer; user-select: none;
        }

        /* Submit */
        .fcl-btn {
          width: 100%; height: 48px;
          background: linear-gradient(135deg, #2250CC 0%, #3B6FE8 100%);
          border: none; border-radius: 10px;
          color: #fff; font-size: 15px; font-weight: 600; font-family: inherit;
          letter-spacing: 0.01em; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(34,80,204,0.32);
          transition: opacity 0.15s, box-shadow 0.15s;
          margin-top: 4px;
        }
        .fcl-btn:hover:not(:disabled) {
          opacity: 0.92;
          box-shadow: 0 6px 20px rgba(34,80,204,0.42);
        }
        .fcl-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

        .fcl-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .fcl-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 4px 0;
        }
        .fcl-divider-line {
          flex: 1; height: 1px; background: #E8ECF5;
        }
        .fcl-divider span {
          font-size: 11px; font-weight: 500; color: #B0B9D0;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        /* Footer */
        .fcl-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 13px;
          color: #8A94B0;
        }
        .fcl-footer a {
          color: #2250CC; font-weight: 600; text-decoration: none;
        }
        .fcl-footer a:hover { text-decoration: underline; }

        /* ─── RIGHT PANEL ──────────────────────────────── */
        .fcl-right {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 64px;
          background: linear-gradient(150deg, #061248 0%, #0E2090 45%, #061248 100%);
        }

        /* Background decoration */
        .fcl-right::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 70% 20%, rgba(80,130,255,0.18) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(40,60,200,0.22) 0%, transparent 45%);
          pointer-events: none;
        }
        .fcl-right::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Hero text */
        .fcl-hero {
          position: relative;
          z-index: 1;
          margin-bottom: 40px;
        }
        .fcl-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 4px 12px 4px 8px;
          margin-bottom: 20px;
        }
        .fcl-hero-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4CF08A;
          box-shadow: 0 0 8px rgba(76,240,138,0.6);
        }
        .fcl-hero-eyebrow span {
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .fcl-hero h2 {
          font-size: clamp(28px, 3.2vw, 40px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 14px;
        }
        .fcl-hero h2 em {
          font-style: normal;
          color: #7CACFF;
        }
        .fcl-hero p {
          font-size: 15px;
          color: rgba(255,255,255,0.50);
          line-height: 1.65;
          max-width: 440px;
        }

        /* ── Dashboard Mockup ─────────────────────────── */
        .fcl-mockup {
          position: relative;
          z-index: 1;
        }

        /* Main card */
        .fcl-card-main {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 16px;
          padding: 20px 22px 18px;
          backdrop-filter: blur(8px);
        }
        .fcl-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .fcl-card-title {
          color: rgba(255,255,255,0.90);
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .fcl-card-title svg { color: rgba(255,255,255,0.45); }
        .fcl-card-period {
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 3px 10px;
          color: rgba(255,255,255,0.45);
          font-size: 11px;
          font-weight: 500;
        }

        /* Stats row */
        .fcl-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .fcl-stat {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .fcl-stat-label {
          color: rgba(255,255,255,0.40);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .fcl-stat-value {
          color: #fff;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .fcl-stat-trend {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #4CF08A;
        }

        /* Bar chart */
        .fcl-chart-wrap {
          position: relative;
        }
        .fcl-chart {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          height: 76px;
        }
        .fcl-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          gap: 4px;
          height: 100%;
          justify-content: flex-end;
        }
        .fcl-bar-fill {
          width: 100%;
          border-radius: 3px 3px 0 0;
          background: rgba(100,160,255,0.28);
          transition: background 0.15s;
          min-height: 4px;
        }
        .fcl-bar-fill.active {
          background: #5493FF;
          box-shadow: 0 -3px 10px rgba(84,147,255,0.50);
        }
        .fcl-bar-label {
          color: rgba(255,255,255,0.25);
          font-size: 8.5px;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .fcl-bar-label.active { color: rgba(255,255,255,0.65); }

        /* Floating overlay card */
        .fcl-card-float {
          position: absolute;
          right: -16px;
          top: -28px;
          background: linear-gradient(135deg, #1A40D8 0%, #2250CC 100%);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 14px;
          padding: 14px 18px;
          width: 162px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20);
        }
        .fcl-float-label {
          color: rgba(255,255,255,0.55);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .fcl-float-value {
          color: #fff;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 6px;
        }
        .fcl-float-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          padding: 2px 8px;
          color: #fff;
          font-size: 10px;
          font-weight: 600;
        }

        /* Second floating card */
        .fcl-card-float2 {
          position: absolute;
          left: -12px;
          bottom: -24px;
          background: rgba(8,20,72,0.90);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 12px 16px;
          width: 172px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fcl-float2-icon {
          width: 34px; height: 34px;
          background: rgba(76,240,138,0.12);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #4CF08A;
        }
        .fcl-float2-label {
          color: rgba(255,255,255,0.40);
          font-size: 10px;
          font-weight: 500;
          margin-bottom: 3px;
          letter-spacing: 0.02em;
        }
        .fcl-float2-value {
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        /* Bottom branding strip */
        .fcl-right-footer {
          position: absolute;
          bottom: 28px;
          left: 64px;
          right: 64px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fcl-right-footer-copy {
          color: rgba(255,255,255,0.20);
          font-size: 11px;
          letter-spacing: 0.05em;
        }
        .fcl-right-footer-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          color: rgba(255,255,255,0.20);
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .fcl-right-footer-badge::before {
          content: "";
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(76,240,138,0.50);
        }
      `}</style>

      <div className="fcl-root">

        {/* ── LEFT: Form Panel ── */}
        <div className="fcl-left">

          {/* Logo */}
          <div className="fcl-logo">
            <div className="fcl-logo-mark">
              <span>FC</span>
            </div>
            <div className="fcl-logo-text">
              <span className="fcl-logo-name">Fynix CoBank</span>
              <span className="fcl-logo-tag">Management Portal</span>
            </div>
          </div>

          {/* Heading */}
          <div className="fcl-heading">
            <h1>Sign in to your account</h1>
            <p>Enter your credentials to access the admin portal</p>
          </div>

          {/* Error */}
          {error && (
            <div className="fcl-error">
              <AlertCircle size={15} />
              <p>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="fcl-form" noValidate>

            <div className="fcl-field">
              <label htmlFor="email" className="fcl-label">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@fynixcobanking.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="fcl-input"
              />
            </div>

            <div className="fcl-field">
              <div className="fcl-row">
                <label htmlFor="password" className="fcl-label">Password</label>
                <Link to="/forgot-password" className="fcl-forgot">Forgot password?</Link>
              </div>
              <div className="fcl-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="fcl-input pr"
                />
                <button
                  type="button"
                  className="fcl-eye"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="fcl-remember">
              <input type="checkbox" className="fcl-checkbox" />
              <span>Keep me signed in for 30 days</span>
            </label>

            <button type="submit" className="fcl-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="fcl-spinner" />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>

          </form>

          <div className="fcl-footer" style={{ marginTop: 28 }}>
            Need access?{" "}
            <a href="mailto:admin@fynixcobanking.com">Contact your administrator</a>
          </div>

        </div>

        {/* ── RIGHT: Hero Panel ── */}
        <div className="fcl-right">

          {/* Hero text */}
          <div className="fcl-hero">
            <div className="fcl-hero-eyebrow">
              <span className="fcl-hero-dot" />
              <span>System Online · All services operational</span>
            </div>
            <h2>
              Welcome back to<br />
              <em>Fynix CoBank</em><br />
              Administration
            </h2>
            <p>
              Manage institutions, monitor live transactions, track billing, and oversee your entire multi-tenant banking infrastructure from a single control center.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="fcl-mockup">

            {/* Floating MRR card — top right */}
            <div className="fcl-card-float">
              <div className="fcl-float-label">Monthly Revenue</div>
              <div className="fcl-float-value">₦4.2M</div>
              <div className="fcl-float-badge">
                <ArrowUpRight size={10} />
                +18.4% MoM
              </div>
            </div>

            {/* Floating tenants card — bottom left */}
            <div className="fcl-card-float2">
              <div className="fcl-float2-icon">
                <Users size={16} />
              </div>
              <div>
                <div className="fcl-float2-label">Active Institutions</div>
                <div className="fcl-float2-value">247 tenants</div>
              </div>
            </div>

            {/* Main activity card */}
            <div className="fcl-card-main">

              <div className="fcl-card-header">
                <div className="fcl-card-title">
                  <BarChart3 size={14} />
                  Tenant Activity — This Year
                </div>
                <div className="fcl-card-period">2026</div>
              </div>

              {/* Stats */}
              <div className="fcl-stats">
                <div className="fcl-stat">
                  <div className="fcl-stat-label">Total Revenue</div>
                  <div className="fcl-stat-value">₦48.2M</div>
                  <div className="fcl-stat-trend">
                    <TrendingUp size={9} /> +12.4%
                  </div>
                </div>
                <div className="fcl-stat">
                  <div className="fcl-stat-label">New Institutions</div>
                  <div className="fcl-stat-value">38</div>
                  <div className="fcl-stat-trend">
                    <TrendingUp size={9} /> +8 this month
                  </div>
                </div>
                <div className="fcl-stat">
                  <div className="fcl-stat-label">System Uptime</div>
                  <div className="fcl-stat-value">99.9%</div>
                  <div className="fcl-stat-trend">
                    <TrendingUp size={9} /> SLA met
                  </div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="fcl-chart-wrap">
                <div className="fcl-chart">
                  {bars.map((bar, i) => (
                    <div className="fcl-bar-col" key={bar.label}>
                      <div
                        className={`fcl-bar-fill${bar.active ? " active" : ""}`}
                        style={{ height: `${bar.h}%` }}
                      />
                      {(i === 0 || i === 3 || i === 6 || i === 9 || i === 11 || bar.active) && (
                        <div className={`fcl-bar-label${bar.active ? " active" : ""}`}>
                          {bar.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Bottom strip */}
          <div className="fcl-right-footer">
            <span className="fcl-right-footer-copy">© 2026 Fynix CoBank · All rights reserved</span>
            <span className="fcl-right-footer-badge">Enterprise-grade security</span>
          </div>

        </div>
      </div>
    </>
  );
}
