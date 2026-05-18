"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { projects } from "@/lib/projects";
import { useAuth } from "@/lib/auth-context";

function getGreeting(): { label: string; icon: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { label: "morning", icon: "🌅" };
  if (hour >= 12 && hour < 18) return { label: "afternoon", icon: "☀️" };
  return { label: "evening", icon: "🌙" };
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const [greeting, setGreeting] = useState({ label: "", icon: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white font-sans">
      <div className="w-full max-w-lg space-y-6 rounded-magic-out border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="space-y-1 text-center">
          <span className="text-3xl">{greeting.icon}</span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good {greeting.label}, Panagiotis
          </h1>
          <p className="text-sm text-white/40">Select a project to manage</p>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={project.adminPath}
              className="flex items-center gap-4 rounded-magic-in border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold tracking-tight text-primary">
                {project.icon}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold">{project.name}</div>
                <div className="truncate text-sm text-white/40">
                  {project.description}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
        >
          Lock
        </button>
      </div>
    </div>
  );
}
