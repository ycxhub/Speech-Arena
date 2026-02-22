"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "@/app/listen-and-log/admin/tasks/actions";

interface Props {
  taskId: string;
  name: string;
  isDraft: boolean;
}

export function TaskNameEditable({ taskId, name, isDraft }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  async function handleSave() {
    if (!isEditing || value.trim() === name) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    const result = await updateTask(taskId, { name: value.trim() });
    setSaving(false);
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setValue(name);
      setIsEditing(false);
    }
  }

  if (!isDraft) {
    return (
      <h1 className="text-xl font-semibold text-neutral-100">
        {name}
      </h1>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className="min-w-[200px] rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xl font-semibold text-neutral-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      />
    );
  }

  return (
    <h1
      className="cursor-pointer text-xl font-semibold text-neutral-100 hover:text-neutral-200"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {name}
    </h1>
  );
}
