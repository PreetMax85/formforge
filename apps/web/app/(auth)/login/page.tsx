"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { setAccessToken } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import AuthShell from "../_components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (res) => {
      if (res.success && res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        toast.success(res.message);
        await new Promise((r) => setTimeout(r, 100));
        router.push("/dashboard");
      } else {
        toast.error("Unexpected response");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthShell
      title="login"
      footer={
        <>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "11px",
              color:      "#4b5563",
            }}
          >
            No account?
          </span>
          <Link
            href="/signup"
            style={{
              fontFamily:     "var(--font-mono)",
              fontSize:       "11px",
              color:          "#569cd6",
              textDecoration: "none",
              letterSpacing:  "0.05em",
            }}
          >
            signup →
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
          Welcome back
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "13px",
            color:      "#6b7280",
            margin:     "6px 0 0",
          }}
        >
          Enter your credentials to access the builder.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Email field */}
        <div style={{ marginBottom: "16px" }}>
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

        {/* Password field */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              marginBottom:   "6px",
            }}
          >
            <Label
              htmlFor="password"
              style={{
                fontFamily:    "var(--font-mono)",
                fontSize:      "10px",
                color:         "#9ca3af",
                letterSpacing: "0.08em",
              }}
            >
              PASSWORD
            </Label>
            <Link
              href="/forgot-password"
              style={{
                fontFamily:     "var(--font-mono)",
                fontSize:       "9px",
                color:          "#4b5563",
                textDecoration: "none",
                letterSpacing:  "0.05em",
              }}
            >
              forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#4b5563] focus:border-[#569cd6] focus:ring-0 rounded-none font-mono text-sm"
            required
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none font-mono text-sm tracking-wider"
        >
          {loginMutation.isPending ? (
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
              AUTHENTICATING...
            </span>
          ) : (
            "ENTER BUILDER →"
          )}
        </Button>
      </form>

    </AuthShell>
  );
}