"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "~/trpc/client";
import { clearAccessToken, initAuth } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import LoadingScreen from "~/components/shared/LoadingScreen";
import { useDelayedLoading } from "~/lib/hooks/useDelayedLoading";
import { toast } from "sonner";
import {
  Plus,
  LogOut,
  FileText,
  Eye,
  Activity,
  BarChart2,
  Layers,
  Inbox,
  Settings,
  Copy,
} from "lucide-react";

import { THEME_META } from '@repo/shared';

function getThemeMeta(theme: string) {
  return THEME_META[theme] ?? THEME_META['default']!;
}

/* ── Overview stat pill ─────────────────────────────────────────── */
function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "#141414",
        border: "1px solid #2a2a2a",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <Icon size={16} style={{ color: "#569cd6", flexShrink: 0 }} />
      <div>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#d4d4d4",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "#6b7280",
            marginTop: "4px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ── Form card ──────────────────────────────────────────────────── */
interface DashboardForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  theme: string;
  responseCount: number;
  viewCount: number;
}

function FormCard({
  form,
  index,
  onClone,
  isCloning,
}: {
  form: DashboardForm;
  index: number;
  onClone: (id: string) => void;
  isCloning: boolean;
}) {
  const router = useRouter();
  const meta = getThemeMeta(form.theme);

  const engagementRate =
    form.viewCount > 0
      ? Math.round((form.responseCount / form.viewCount) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
        delay: index * 0.05,
      }}
      whileHover={{ y: -4 }}
      style={{ height: "100%" }}
    >
      <div
        style={{
          background: "#141414",
          border: "1px solid #2a2a2a",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = `${meta.color}60`;
          el.style.boxShadow = `0 0 20px ${meta.color}15`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "#2a2a2a";
          el.style.boxShadow = "none";
        }}
        onClick={() => router.push(`/dashboard/forms/${form.id}/builder`)}
      >
        {/* Card body */}
        <div style={{ padding: "20px", flex: 1 }}>
          {/* Theme badge + Duplicate action */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: meta.color,
                background: meta.bg,
                padding: "2px 8px",
                letterSpacing: "0.06em",
                display: "inline-block",
              }}
            >
              {meta.label}
            </span>
            <button
              type="button"
              aria-label="Duplicate form"
              disabled={isCloning}
              onClick={(e) => {
                e.stopPropagation();
                onClone(form.id);
              }}
              style={{
                background: "transparent",
                border: "1px solid #2a2a2a",
                color: "#6b7280",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isCloning ? "wait" : "pointer",
                opacity: isCloning ? 0.5 : 1,
                transition: "color 0.15s, border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (isCloning) return;
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = meta.color;
                el.style.borderColor = `${meta.color}60`;
                el.style.background = meta.bg;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "#6b7280";
                el.style.borderColor = "#2a2a2a";
                el.style.background = "transparent";
              }}
            >
              <Copy size={12} />
            </button>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#d4d4d4",
              marginBottom: "6px",
              lineHeight: 1.3,
            }}
          >
            {form.title}
          </h3>

          {/* Description */}
          {form.description && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "#6b7280",
                lineHeight: 1.6,
                marginBottom: "16px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {form.description}
            </p>
          )}

          {/* Status + slug row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: form.status === "published" ? "#4caf50" : "#ff9800",
                background:
                  form.status === "published"
                    ? "rgba(76,175,80,0.1)"
                    : "rgba(255,152,0,0.1)",
                padding: "2px 8px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {form.status}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#4b5563",
              }}
            >
              /{form.slug}
            </span>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <FileText size={11} style={{ color: "#4b5563" }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                {form.responseCount.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Eye size={11} style={{ color: "#4b5563" }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                {form.viewCount.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={11} style={{ color: "#4b5563" }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                {engagementRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid #2a2a2a",
          }}
        >
          {[
            { label: "Overview", icon: BarChart2, href: `/dashboard/forms/${form.id}` },
            { label: "Builder", icon: Layers, href: `/dashboard/forms/${form.id}/builder` },
            { label: "Responses", icon: Inbox, href: `/dashboard/forms/${form.id}/responses` },
            { label: "Settings", icon: Settings, href: `/dashboard/forms/${form.id}/settings` },
          ].map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "10px 4px",
                textDecoration: "none",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: "#6b7280",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                borderRight: "1px solid #2a2a2a",
                transition: "color 0.15s, background 0.15s",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = "#569cd6";
                el.style.background = "#1e1e1e";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.color = "#6b7280";
                el.style.background = "transparent";
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initAuth().then((ok) => {
      if (!ok) {
        router.push("/login");
        return;
      }
      setAuthReady(true);
    });
  }, [router]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: authReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const myFormsQuery = trpc.forms.myForms.useQuery(undefined, {
    enabled: authReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (meQuery.error) {
      clearAccessToken();
      router.push("/login");
    }
  }, [meQuery.error, router]);

  const createFormMutation = trpc.forms.create.useMutation({
    onSuccess: (res) => {
      toast.success("Form created");
      if (res.data?.id) {
        router.push(`/dashboard/forms/${res.data.id}/builder`);
      }
      myFormsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create form");
    },
  });

  const cloneFormMutation = trpc.forms.clone.useMutation({
    onSuccess: (res) => {
      toast.success(`Duplicated as "${res.data?.title}"`);
      myFormsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to duplicate form");
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.clear();
      clearAccessToken();
      toast.success("Logged out");
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Logout failed");
    },
  });

  const forms = (myFormsQuery.data?.data?.items ?? []) as unknown as DashboardForm[];

  /* Aggregates */
  const totalForms = forms.length;
  const totalResponses = forms.reduce((sum, f) => sum + f.responseCount, 0);
  const totalViews = forms.reduce((sum, f) => sum + f.viewCount, 0);
  const avgEngagement = totalViews > 0 ? Math.round((totalResponses / totalViews) * 100) : 0;

  const isLoading = !authReady || meQuery.isLoading || myFormsQuery.isLoading;
  const showLoading = useDelayedLoading(isLoading);

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <LoadingScreen key="loading" variant="fullscreen" />
      ) : (
        <div
          key="content"
          className="min-h-screen"
          style={{
            background: "#1e1e1e",
            color: "#d4d4d4",
            fontFamily: "'Inter', sans-serif",
            padding: "32px",
          }}
        >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#d4d4d4",
              marginBottom: "4px",
            }}
          >
            My Forms
          </h1>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "#6b7280",
            }}
          >
            {forms.length === 0
              ? "Scene is empty. Press [+ New Form] to instantiate your first GameObject."
              : `${forms.length} form${forms.length === 1 ? "" : "s"} in your scene.`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {meQuery.data?.data && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              {meQuery.data.data.email}
            </span>
          )}
          <Button
            onClick={() =>
              createFormMutation.mutate({
                title: "Untitled Form",
                theme: "default",
              })
            }
            className="bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="outline"
            className="border-[#3c3c3c] text-[#d4d4d4] hover:bg-[#2a2a2a] rounded-none cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>

      {/* ── Creator overview bar ───────────────────────────────── */}
      {forms.length > 0 && (
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ gap: "1px", background: "#2a2a2a", marginBottom: "28px" }}
        >
          <StatPill icon={FileText} label="Total Forms" value={totalForms} />
          <StatPill icon={BarChart2} label="Total Responses" value={totalResponses.toLocaleString()} />
          <StatPill icon={Eye} label="Total Views" value={totalViews.toLocaleString()} />
          <StatPill icon={Activity} label="Avg Engagement" value={`${avgEngagement}%`} />
        </div>
      )}

      {/* ── Form grid ──────────────────────────────────────────── */}
      {forms.length > 0 ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "16px" }}
        >
          {forms.map((form, i) => (
            <FormCard
              key={form.id}
              form={form}
              index={i}
              onClone={(id) => cloneFormMutation.mutate({ id })}
              isCloning={cloneFormMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            border: "1px dashed #3c3c3c",
          }}
        >
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              color: "#4b5563",
              marginBottom: "16px",
            }}
          >
            Scene is empty. No GameObjects found.
          </p>
          <Button
            onClick={() =>
              createFormMutation.mutate({
                title: "Untitled Form",
                theme: "default",
              })
            }
            className="bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Instantiate Form
          </Button>
        </div>
      )}
    </div>
      )}
    </AnimatePresence>
  );
}
