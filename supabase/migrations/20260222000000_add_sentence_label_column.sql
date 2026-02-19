-- Add sentence_label column to sentences table.
-- Valid values: Social Media, Narration, Story Telling, Outbound Calls, Personal Assistants, Customer Service, News, Others
-- Nullable for existing rows; required for new inserts (enforced at app level).

ALTER TABLE public.sentences
ADD COLUMN IF NOT EXISTS sentence_label text;

-- Constraint: if set, must be one of the allowed values
ALTER TABLE public.sentences
ADD CONSTRAINT sentences_sentence_label_check
CHECK (
  sentence_label IS NULL
  OR sentence_label IN (
    'Social Media',
    'Narration',
    'Story Telling',
    'Outbound Calls',
    'Personal Assistants',
    'Customer Service',
    'News',
    'Others'
  )
);
