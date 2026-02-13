export type ModelRow = {
  id: string;
  name: string;
  model_id: string;
  voice_id?: string | null;
  gender: string;
  languages: string[];
  tags: string[];
  is_active: boolean;
  created_at: string;
};

const TAG_COLORS: Record<string, "purple" | "green" | "yellow" | "blue"> = {
  neural: "purple",
  fast: "green",
  premium: "yellow",
};

export function getTagColor(tag: string): "purple" | "green" | "yellow" | "blue" {
  return TAG_COLORS[tag.toLowerCase()] ?? "blue";
}
