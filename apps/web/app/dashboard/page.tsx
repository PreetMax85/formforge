"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { clearAccessToken, initAuth } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initAuth()
      .then(() => setAuthReady(true))
      .catch(() => setAuthReady(true));
  }, []);

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

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearAccessToken();
      toast.success("Logged out");
      router.push("/login");
    },
    onError: (err) => {
      toast.error(err.message || "Logout failed");
    },
  });

  const forms = myFormsQuery.data?.data?.items ?? [];

  return (
    <div className="bg-[#1e1e1e] text-[#d4d4d4] min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Forms</h1>
          <p className="text-[#9ca3af] mt-2">
            {forms.length === 0
              ? "Scene is empty. Press [+ New Form] to instantiate your first GameObject."
              : `${forms.length} form${forms.length === 1 ? "" : "s"} in your scene.`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {meQuery.data?.data && (
            <span className="text-sm text-[#9ca3af]">
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
            className="bg-[#569cd6] text-[#0e0e0e] hover:bg-[#4a8bc2] font-medium rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
          <Button
            onClick={() => logoutMutation.mutate()}
            variant="outline"
            className="border-[#3c3c3c] text-[#d4d4d4] hover:bg-[#2a2a2a] rounded-none"
          >
            Log out
          </Button>
        </div>
      </div>

      {forms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form: any) => (
            <div
              key={form.id}
              className="border border-[#2a2a2a] bg-[#141414] p-4 hover:border-[#569cd6]/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/forms/${form.id}/builder`)}
            >
              <h3 className="font-semibold text-[#d4d4d4]">{form.title}</h3>
              <p className="text-xs text-[#6b7280] mt-1">
                {form.status} · {form.theme}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
