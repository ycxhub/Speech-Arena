"use client";

import Link from "next/link";
import { TaskCard } from "./task-card";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

interface Task {
  id: string;
  name: string;
  description: string | null;
  tool_type: string;
  status: string;
  completed: number;
  total: number;
  lastDisplayIndex: number | null;
  lastItemIndex: number | null;
}

interface Props {
  tasks: Task[];
  isAdmin?: boolean;
}

export function TaskList({ tasks, isAdmin = false }: Props) {
  if (tasks.length === 0) {
    if (isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-12">
          <p className="text-center text-sm text-neutral-400">
            Get started by creating a new task.
          </p>
          <Link href="/listen-and-log/admin/tasks/new">
            <LnlButton>Create your first task</LnlButton>
          </Link>
        </div>
      );
    }
    return (
      <p className="rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-8 text-center text-sm text-neutral-500">
        No tasks assigned yet. Ask your admin to add tasks.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
