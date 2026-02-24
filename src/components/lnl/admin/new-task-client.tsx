"use client";

import { useState } from "react";
import { TaskTypeSelector, type TaskType } from "./task-type-selector";
import { CreateFromBlindTestsForm } from "./create-from-blind-tests-form";
import { TaskCreationWizard } from "./task-creation-wizard";
import { CreateOnTheFlyWizard } from "./create-on-the-fly-wizard";
import { LnlButton } from "@/components/lnl/ui/lnl-button";

interface Props {
  availableUsers: Array<{ user_id: string; email: string; role: string }>;
}

export function NewTaskClient({ availableUsers }: Props) {
  const [selectedType, setSelectedType] = useState<TaskType | null>(null);

  return (
    <div className="flex flex-col gap-8">
      {selectedType === null && (
        <TaskTypeSelector
          selectedType={null}
          onSelect={setSelectedType}
        />
      )}

      {selectedType === "blind_tests" && (
        <div className="flex flex-col gap-4">
          <LnlButton
            variant="ghost"
            size="sm"
            onClick={() => setSelectedType(null)}
            className="self-start"
          >
            Back to task type
          </LnlButton>
          <CreateFromBlindTestsForm />
        </div>
      )}

      {selectedType === "manual" && (
        <div className="flex flex-col gap-4">
          <LnlButton
            variant="ghost"
            size="sm"
            onClick={() => setSelectedType(null)}
            className="self-start"
          >
            Back to task type
          </LnlButton>
          <TaskCreationWizard
            availableUsers={availableUsers}
          />
        </div>
      )}

      {selectedType === "on_the_fly" && (
        <div className="flex flex-col gap-4">
          <LnlButton
            variant="ghost"
            size="sm"
            onClick={() => setSelectedType(null)}
            className="self-start"
          >
            Back to task type
          </LnlButton>
          <CreateOnTheFlyWizard availableUsers={availableUsers} />
        </div>
      )}
    </div>
  );
}
