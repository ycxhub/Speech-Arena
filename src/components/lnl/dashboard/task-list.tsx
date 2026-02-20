"use client";

import { TaskCard } from "./task-card";

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
}

export function TaskList({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-700 bg-neutral-950/50 p-8 text-center text-sm text-neutral-500">
        No assigned tasks yet. Ask your admin to assign you to a task.
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
