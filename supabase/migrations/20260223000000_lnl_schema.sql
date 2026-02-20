-- Listen & Log Platform Schema
-- Creates all lnl_* tables, helper functions, and RLS policies
-- Order: tables → functions → RLS policies

-- ============================================================
-- PART 1: TABLE DEFINITIONS
-- ============================================================

-- Table: lnl_user_roles
CREATE TABLE public.lnl_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('lnl_admin', 'lnl_auditor', 'lnl_annotator')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lnl_user_roles_user_unique UNIQUE (user_id)
);

-- Table: lnl_invitations
CREATE TABLE public.lnl_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('lnl_admin', 'lnl_auditor', 'lnl_annotator')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_ids uuid[] DEFAULT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: lnl_tasks
CREATE TABLE public.lnl_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  tool_type text NOT NULL CHECK (tool_type IN ('text_annotation', 'audio_evaluation', 'ipa_validation')),
  label_config jsonb NOT NULL DEFAULT '{}',
  task_options jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: lnl_task_items
CREATE TABLE public.lnl_task_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.lnl_tasks(id) ON DELETE CASCADE,
  item_index integer NOT NULL,
  audio_url text NOT NULL,
  text text NOT NULL,
  ipa_text text,
  normalized_text text,
  metadata jsonb DEFAULT '{}',
  word_timestamps jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lnl_task_items_task_index_unique UNIQUE (task_id, item_index)
);

CREATE INDEX idx_lnl_task_items_task_id ON public.lnl_task_items(task_id);

-- Table: lnl_task_assignments
CREATE TABLE public.lnl_task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.lnl_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('annotator', 'auditor')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lnl_task_assignments_task_user_unique UNIQUE (task_id, user_id)
);

-- Table: lnl_annotations
CREATE TABLE public.lnl_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.lnl_tasks(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.lnl_task_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  is_current boolean NOT NULL DEFAULT true,
  labels jsonb NOT NULL DEFAULT '[]',
  boolean_answers jsonb NOT NULL DEFAULT '{}',
  scores jsonb NOT NULL DEFAULT '{}',
  overall_comment text DEFAULT '',
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'flagged', 'reviewed')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto', 'auto_reviewed')),
  time_spent_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lnl_annotations_item_user_current
  ON public.lnl_annotations(item_id, user_id, is_current);

CREATE INDEX idx_lnl_annotations_task_user
  ON public.lnl_annotations(task_id, user_id);

-- Table: lnl_annotation_history
CREATE TABLE public.lnl_annotation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id uuid NOT NULL REFERENCES public.lnl_annotations(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_data jsonb NOT NULL,
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'reviewed', 'reopened')),
  change_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lnl_annotation_history_annotation
  ON public.lnl_annotation_history(annotation_id);

-- ============================================================
-- PART 2: HELPER FUNCTIONS (tables must exist first)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_lnl_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_uuid AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.lnl_user_roles WHERE user_id = user_uuid AND role = 'lnl_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_task(user_uuid uuid, task_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lnl_task_assignments
    WHERE user_id = user_uuid AND task_id = task_uuid
  );
$$;

-- ============================================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.lnl_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnl_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnl_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnl_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnl_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnl_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnl_annotation_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: RLS POLICIES
-- ============================================================

-- lnl_user_roles policies
CREATE POLICY "Users can read own lnl role"
  ON public.lnl_user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can insert roles"
  ON public.lnl_user_roles FOR INSERT
  WITH CHECK (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can update roles"
  ON public.lnl_user_roles FOR UPDATE
  USING (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can delete roles"
  ON public.lnl_user_roles FOR DELETE
  USING (public.is_lnl_admin(auth.uid()));

-- lnl_invitations policies
CREATE POLICY "Anyone can read invitations"
  ON public.lnl_invitations FOR SELECT
  USING (true);

CREATE POLICY "LNL admins can create invitations"
  ON public.lnl_invitations FOR INSERT
  WITH CHECK (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can update invitations"
  ON public.lnl_invitations FOR UPDATE
  USING (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can delete invitations"
  ON public.lnl_invitations FOR DELETE
  USING (public.is_lnl_admin(auth.uid()));

-- lnl_tasks policies
CREATE POLICY "Assigned users and admins can read tasks"
  ON public.lnl_tasks FOR SELECT
  USING (
    public.is_lnl_admin(auth.uid())
    OR public.is_assigned_to_task(auth.uid(), id)
  );

CREATE POLICY "LNL admins can create tasks"
  ON public.lnl_tasks FOR INSERT
  WITH CHECK (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can update tasks"
  ON public.lnl_tasks FOR UPDATE
  USING (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can delete tasks"
  ON public.lnl_tasks FOR DELETE
  USING (public.is_lnl_admin(auth.uid()));

-- lnl_task_items policies
CREATE POLICY "Assigned users and admins can read task items"
  ON public.lnl_task_items FOR SELECT
  USING (
    public.is_lnl_admin(auth.uid())
    OR public.is_assigned_to_task(auth.uid(), task_id)
  );

CREATE POLICY "LNL admins can insert task items"
  ON public.lnl_task_items FOR INSERT
  WITH CHECK (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can update task items"
  ON public.lnl_task_items FOR UPDATE
  USING (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can delete task items"
  ON public.lnl_task_items FOR DELETE
  USING (public.is_lnl_admin(auth.uid()));

-- lnl_task_assignments policies
CREATE POLICY "Users can see own assignments, admins see all"
  ON public.lnl_task_assignments FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_lnl_admin(auth.uid())
  );

CREATE POLICY "LNL admins can create assignments"
  ON public.lnl_task_assignments FOR INSERT
  WITH CHECK (public.is_lnl_admin(auth.uid()));

CREATE POLICY "LNL admins can delete assignments"
  ON public.lnl_task_assignments FOR DELETE
  USING (public.is_lnl_admin(auth.uid()));

-- lnl_annotations policies
CREATE POLICY "Assigned users can read all annotations for their tasks"
  ON public.lnl_annotations FOR SELECT
  USING (
    public.is_lnl_admin(auth.uid())
    OR public.is_assigned_to_task(auth.uid(), task_id)
  );

CREATE POLICY "Assigned annotators and auditors can insert annotations"
  ON public.lnl_annotations FOR INSERT
  WITH CHECK (
    public.is_lnl_admin(auth.uid())
    OR public.is_assigned_to_task(auth.uid(), task_id)
  );

CREATE POLICY "Annotation owner or auditors can update annotations"
  ON public.lnl_annotations FOR UPDATE
  USING (
    public.is_lnl_admin(auth.uid())
    OR auth.uid() = user_id
    OR (
      public.is_assigned_to_task(auth.uid(), task_id)
      AND EXISTS (
        SELECT 1 FROM public.lnl_task_assignments
        WHERE task_id = lnl_annotations.task_id
          AND user_id = auth.uid()
          AND role = 'auditor'
      )
    )
  );

-- lnl_annotation_history policies
CREATE POLICY "Assigned users can read annotation history"
  ON public.lnl_annotation_history FOR SELECT
  USING (
    public.is_lnl_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.lnl_annotations a
      WHERE a.id = lnl_annotation_history.annotation_id
        AND public.is_assigned_to_task(auth.uid(), a.task_id)
    )
  );
