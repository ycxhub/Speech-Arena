"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";
import {
  createPlaygroundPage,
  deletePlaygroundPage,
  type PlaygroundPageRow,
} from "./actions";
import { toast } from "sonner";

interface Props {
  pages: PlaygroundPageRow[];
}

export function PlaygroundListClient({ pages }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    headline: "",
    modelALabel: "",
    modelBLabel: "",
    modelAProviderSlug: "",
    modelAModelId: "",
    modelBProviderSlug: "",
    modelBModelId: "",
  });

  const handleCreate = async () => {
    setCreating(true);
    const { error, id } = await createPlaygroundPage(form);
    setCreating(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Playground page created");
      setShowCreate(false);
      setForm({
        slug: "",
        title: "",
        headline: "",
        modelALabel: "",
        modelBLabel: "",
        modelAProviderSlug: "",
        modelAModelId: "",
        modelBProviderSlug: "",
        modelBModelId: "",
      });
      window.location.reload();
    }
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Delete playground page "${slug}"?`)) return;
    const { error } = await deletePlaygroundPage(id);
    if (error) toast.error(error);
    else {
      toast.success("Deleted");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GlassButton onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Page"}
        </GlassButton>
      </div>

      {showCreate && (
        <div className="glass space-y-3 p-4">
          <h3 className="text-sm font-semibold text-white">New Playground Page</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Slug (e.g. falcon-vs-polly-neural)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Title (browser tab)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="col-span-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Headline (displayed on page)"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Model A Label (e.g. Murf Falcon)"
              value={form.modelALabel}
              onChange={(e) => setForm({ ...form, modelALabel: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Model B Label (e.g. Amazon Polly Neural)"
              value={form.modelBLabel}
              onChange={(e) => setForm({ ...form, modelBLabel: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Model A Provider Slug (e.g. murf)"
              value={form.modelAProviderSlug}
              onChange={(e) => setForm({ ...form, modelAProviderSlug: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Model A Model ID (e.g. FALCON)"
              value={form.modelAModelId}
              onChange={(e) => setForm({ ...form, modelAModelId: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Model B Provider Slug (e.g. amazon-polly)"
              value={form.modelBProviderSlug}
              onChange={(e) => setForm({ ...form, modelBProviderSlug: e.target.value })}
            />
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder="Model B Model ID (e.g. neural)"
              value={form.modelBModelId}
              onChange={(e) => setForm({ ...form, modelBModelId: e.target.value })}
            />
          </div>
          <GlassButton
            onClick={handleCreate}
            disabled={
              creating ||
              !form.slug ||
              !form.title ||
              !form.headline ||
              !form.modelALabel ||
              !form.modelBLabel
            }
          >
            {creating ? "Creating..." : "Create"}
          </GlassButton>
        </div>
      )}

      {pages.length === 0 ? (
        <p className="text-sm text-white/40">No playground pages yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/60">
              <th className="pb-2 font-medium">Slug</th>
              <th className="pb-2 font-medium">Models</th>
              <th className="pb-2 font-medium">Sentences</th>
              <th className="pb-2 font-medium">Active</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pages.map((p) => (
              <tr key={p.id}>
                <td className="py-2 text-white">{p.slug}</td>
                <td className="py-2 text-white/60">
                  {p.model_a_label} vs {p.model_b_label}
                </td>
                <td className="py-2 text-white/60">{p.sentence_count}</td>
                <td className="py-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      p.is_active ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                </td>
                <td className="flex gap-2 py-2">
                  <Link href={`/admin/murf-playground/${p.id}`}>
                    <GlassButton variant="secondary" size="sm">
                      Edit
                    </GlassButton>
                  </Link>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    accent="red"
                    onClick={() => handleDelete(p.id, p.slug)}
                  >
                    Delete
                  </GlassButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
