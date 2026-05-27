"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "~/trpc/client";
import { setAccessToken } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "../_components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: async (res) => {
      if (res.success && res.data?.accessToken) {
        queryClient.clear();
        setAccessToken(res.data.accessToken);
        toast.success(res.message);
        await new Promise((r) => setTimeout(r, 100));
        router.push("/dashboard");
      } else {
        toast.error("Unexpected response");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Signup failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    signupMutation.mutate({ name: name.trim(), email, password });
  };

  return (
    <AuthShell
      title="signup"
      footer={
        <>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "11px",
              color:      "#4b5563",
            }}
          >
            Have an account?
          </span>
          <Link
            href="/login"
            style={{
              fontFamily:     "var(--font-mono)",
              fontSize:       "11px",
              color:          "#569cd6",
              textDecoration: "none",
              letterSpacing:  "0.05em",
            }}
          >
            login →
          </Link>
        </>
      }
    >
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "22px",
            fontWeight:    700,
            color:         "#d4d4d4",
            margin:        0,
            letterSpacing: "-0.02em",
          }}
        >
          Instantiate account
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "13px",
            color:      "#6b7280",
            margin:     "6px 0 0",
          }}
        >
          One form away from the builder.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={{ marginBottom: "14px" }}>
          <Label
            htmlFor="name"
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              color:         "#9ca3af",
              letterSpacing: "0.08em",
              display:       "block",
              marginBottom:  "6px",
            }}
          >
            DISPLAY_NAME
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#4b5563] focus:border-[#569cd6] focus:ring-0 rounded-none font-mono text-sm"
            required
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "14px" }}>
          <Label
            htmlFor="email"
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              color:         "#9ca3af",
              letterSpacing: "0.08em",
              display:       "block",
              marginBottom:  "6px",
            }}
          >
            EMAIL_ADDRESS
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#4b5563] focus:border-[#569cd6] focus:ring-0 rounded-none font-mono text-sm"
            required
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "14px" }}>
          <Label
            htmlFor="password"
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              color:         "#9ca3af",
              letterSpacing: "0.08em",
              display:       "block",
              marginBottom:  "6px",
            }}
          >
            PASSWORD
          </Label>
          <div style={{ position: 'relative' }}>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#4b5563] focus:border-[#569cd6] focus:ring-0 rounded-none font-mono text-sm pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position:   'absolute',
                right:      '10px',
                top:        '50%',
                transform:  'translateY(-50%)',
                background: 'transparent',
                border:     'none',
                color:      '#9ca3af',
                cursor:     'pointer',
                padding:    '4px',
                display:    'flex',
                alignItems: 'center',
              }}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Password requirements checklist */}
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { label: 'At least 8 characters', met: password.length >= 8 },
              { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
              { label: 'One number', met: /[0-9]/.test(password) },
            ].map((rule) => (
              <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize:     '10px',
                    fontFamily:   "'JetBrains Mono', monospace",
                    color:        rule.met ? '#66bb6a' : '#4b5563',
                    transition:   'color 0.2s',
                  }}
                >
                  {rule.met ? '✓' : '○'}
                </span>
                <span
                  style={{
                    fontSize:     '11px',
                    fontFamily:   "'JetBrains Mono', monospace",
                    color:        rule.met ? '#9ca3af' : '#4b5563',
                    transition:   'color 0.2s',
                  }}
                >
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: "24px" }}>
          <Label
            htmlFor="confirmPassword"
            style={{
              fontFamily:    "var(--font-mono)",
              fontSize:      "10px",
              color:         "#9ca3af",
              letterSpacing: "0.08em",
              display:       "block",
              marginBottom:  "6px",
            }}
          >
            CONFIRM PASSWORD
          </Label>
          <div style={{ position: 'relative' }}>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#4b5563] focus:border-[#569cd6] focus:ring-0 rounded-none font-mono text-sm pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              style={{
                position:   'absolute',
                right:      '10px',
                top:        '50%',
                transform:  'translateY(-50%)',
                background: 'transparent',
                border:     'none',
                color:      '#9ca3af',
                cursor:     'pointer',
                padding:    '4px',
                display:    'flex',
                alignItems: 'center',
              }}
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none font-mono text-sm tracking-wider"
        >
          {signupMutation.isPending ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width:        "10px",
                  height:       "10px",
                  border:       "2px solid #0e0e0e",
                  borderTop:    "2px solid transparent",
                  borderRadius: "50%",
                  display:      "inline-block",
                  animation:    "spin 0.7s linear infinite",
                }}
              />
              INSTANTIATING...
            </span>
          ) : (
            "CREATE ACCOUNT →"
          )}
        </Button>
      </form>

    </AuthShell>
  );
}