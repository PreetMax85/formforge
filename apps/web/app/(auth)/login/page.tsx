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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
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
      toast.error(err.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <main className="bg-[#0e0e0e] text-[#d4d4d4] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#2a2a2a] bg-[#141414] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">
            Log in to FormForge
          </h1>
          <p className="text-[#9ca3af] mt-2 text-sm">
            Enter your credentials to access the builder.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
          </div>

          <Button
            type="submit"
            disabled={isLoading || loginMutation.isPending}
            className="w-full bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none"
          >
            {loginMutation.isPending ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9ca3af]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#569cd6] hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
