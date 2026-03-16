"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import {
  updatePlaygroundPage,
  addSentence,
  updateSentence,
  deleteSentence,
  type SampleSentenceRow,
} from "../actions";
import { PlaygroundCsvUploadModal } from "./csv-upload-modal";
import { toast } from "sonner";

interface Props {
  page: {
    id: string;
    slug: string;
    title: string;
    headline: string;
    model_a_label: string;
    model_b_label: string;
    model_a_provider_slug: string;
    model_a_model_id: string;
    model_b_provider_slug: string;
    model_b_model_id: string;
    is_active: boolean;
  };
  sentences: SampleSentenceRow[];
  languages: { id: string; code: string; name: string }[];
}

export function PlaygroundEditClient({ page, sentences, languages }: Props) {
  const [form, setForm] = useState({
    slug: page.slug,
    title: page.title,
    headline: page.headline,
    model_a_label: page.model_a_label,
    model_b_label: page.model_b_label,
    model_a_provider_slug: page.model_a_provider_slug,
    model_a_model_id: page.model_a_model_id,
    model_b_provider_slug: page.model_b_provider_slug,
    model_b_model_id: page.model_b_model_id,
    is_active: page.is_active,
  });
  const [saving, setSaving] = useState(false);

  const [filterLang, setFilterLang] = useState("");
  const [newSentenceLang, setNewSentenceLang] = useState(languages[0]?.id ?? "");
  const [newSentenceText, setNewSentenceText] = useState("");
  const [addingSentence, setAddingSentence] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updatePlaygroundPage(page.id, form);
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Saved");
  };

  const handleAddSentence = async () => {
    if (!newSentenceText.trim() || !newSentenceLang) return;
    setAddingSentence(true);
    const { error } = await addSentence(page.id, newSentenceLang, newSentenceText);
    setAddingSentence(false);
    if (error) toast.error(error);
    else {
      toast.success("Sentence added");
      setNewSentenceText("");
      window.location.reload();
    }
  };

  const handleEditSave = async (id: string) => {
    const { error } = await updateSentence(id, editText);
    if (error) toast.error(error);
    else {
      toast.success("Updated");
      setEditingId(null);
      window.location.reload();
    }
  };

  const handleDeleteSentence = async (id: string) => {
    if (!confirm("Delete this sentence?")) return;
    const { error } = await deleteSentence(id);
    if (error) toast.error(error);
    else {
      toast.success("Deleted");
      window.location.reload();
    }
  };

  const filteredSentences = filterLang
    ? sentences.filter((s) => s.language_id === filterLang)
    : sentences;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/murf-playground"
        className="text-sm text-white/60 hover:text-white"
      >
        ← Back to list
      </Link>

      {/* Page settings */}
      <GlassCard>
        <h2 className="mb-4 text-section-heading text-white">Page Settings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-white/60">Slug</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Title</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="col-span-full">
            <label className="mb-1 block text-xs text-white/60">Headline</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Model A Label</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.model_a_label}
              onChange={(e) => setForm({ ...form, model_a_label: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Model B Label</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.model_b_label}
              onChange={(e) => setForm({ ...form, model_b_label: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Model A Provider Slug</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.model_a_provider_slug}
              onChange={(e) => setForm({ ...form, model_a_provider_slug: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Model A Model ID</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.model_a_model_id}
              onChange={(e) => setForm({ ...form, model_a_model_id: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Model B Provider Slug</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.model_b_provider_slug}
              onChange={(e) => setForm({ ...form, model_b_provider_slug: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Model B Model ID</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              value={form.model_b_model_id}
              onChange={(e) => setForm({ ...form, model_b_model_id: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4"
            />
            <label className="text-sm text-white/60">Active</label>
          </div>
        </div>
        <div className="mt-4">
          <GlassButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Sample sentences */}
      <GlassCard>
        <h2 className="mb-4 text-section-heading text-white">Sample Sentences</h2>

        {/* Add sentence */}
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={newSentenceLang}
            onChange={(e) => setNewSentenceLang(e.target.value)}
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
          <input
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
            placeholder="Enter sentence text..."
            value={newSentenceText}
            onChange={(e) => setNewSentenceText(e.target.value)}
          />
          <GlassButton
            onClick={handleAddSentence}
            disabled={addingSentence || !newSentenceText.trim()}
            size="sm"
          >
            {addingSentence ? "Adding..." : "Add"}
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => setCsvModalOpen(true)}
          >
            Upload CSV
          </GlassButton>
        </div>

        <PlaygroundCsvUploadModal
          open={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          pageId={page.id}
          languages={languages}
          onSuccess={() => window.location.reload()}
        />

        {/* Language filter */}
        <div className="mb-3">
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
          >
            <option value="">All languages</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        {/* Sentence list */}
        {filteredSentences.length === 0 ? (
          <p className="text-sm text-white/40">No sentences yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="pb-2 font-medium">Text</th>
                <th className="pb-2 font-medium">Language</th>
                <th className="pb-2 font-medium">Usecase</th>
                <th className="pb-2 font-medium">Industry</th>
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSentences.map((s) => (
                <tr key={s.id}>
                  <td className="max-w-md py-2 text-white">
                    {editingId === s.id ? (
                      <input
                        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                    ) : (
                      <span className="line-clamp-2">{s.text}</span>
                    )}
                  </td>
                  <td className="py-2 text-white/60">{s.language_code}</td>
                  <td className="py-2 text-white/60">{s.usecase ?? "—"}</td>
                  <td className="py-2 text-white/60">{s.industry ?? "—"}</td>
                  <td className="py-2 text-white/60">{s.sort_order}</td>
                  <td className="flex gap-1 py-2">
                    {editingId === s.id ? (
                      <>
                        <GlassButton
                          size="sm"
                          onClick={() => handleEditSave(s.id)}
                        >
                          Save
                        </GlassButton>
                        <GlassButton
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </GlassButton>
                      </>
                    ) : (
                      <>
                        <GlassButton
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(s.id);
                            setEditText(s.text);
                          }}
                        >
                          Edit
                        </GlassButton>
                        <GlassButton
                          size="sm"
                          variant="secondary"
                          accent="red"
                          onClick={() => handleDeleteSentence(s.id)}
                        >
                          Del
                        </GlassButton>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
