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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (res) => {
      if (res.success && res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        toast.success(res.message);
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
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
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
    setIsLoading(true);
    signupMutation.mutate({ name, email, password });
  };

  return (
    <main className="bg-[#0e0e0e] text-[#d4d4d4] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#2a2a2a] bg-[#141414] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            Create your account
          </h1>
          <p className="text-[#9ca3af] mt-2 text-sm">
            Start building forms in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-[#d4d4d4]">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#6b7280] focus:border-[#569cd6] focus:ring-0 rounded-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-[#d4d4d4]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#6b7280] focus:border-[#569cd6] focus:ring-0 rounded-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-[#d4d4d4]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#6b7280] focus:border-[#569cd6] focus:ring-0 rounded-none"
              required
            />
            <p className="text-xs text-[#6b7280]">
              Must be at least 8 characters with an uppercase letter.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm text-[#d4d4d4]">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#1e1e1e] border-[#3c3c3c] text-[#d4d4d4] placeholder:text-[#6b7280] focus:border-[#569cd6] focus:ring-0 rounded-none"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || signupMutation.isPending}
            className="w-full bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none"
          >
            {signupMutation.isPending ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9ca3af]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#569cd6] hover:underline font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
