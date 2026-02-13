"use client";

import { useState } from "react";
import { GlassModal } from "@/components/ui/glass-modal";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { addApiKey } from "./actions";
import { toast } from "sonner";

interface AddKeyModalProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  onSuccess?: () => void;
}

export function AddKeyModal({
  open,
  onClose,
  providerId,
  onSuccess,
}: AddKeyModalProps) {
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);

  const validate = () => {
    let valid = true;
    if (!keyName.trim()) {
      setNameError("Key name is required");
      valid = false;
    } else setNameError(null);
    if (!keyValue.trim()) {
      setValueError("API key value is required");
      valid = false;
    } else setValueError(null);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await addApiKey(providerId, keyName.trim(), keyValue.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("API key added");
      onClose();
      onSuccess?.();
      setKeyName("");
      setKeyValue("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setKeyName("");
    setKeyValue("");
    setNameError(null);
    setValueError(null);
    onClose();
  };

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Add API Key"
      footer={
        <>
          <GlassButton variant="ghost" onClick={handleClose}>
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Add
          </GlassButton>
        </>
      }
    >
      <div className="space-y-4">
        <GlassInput
          label="Key name"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          error={nameError ?? undefined}
          placeholder="e.g. Production key"
        />
        <GlassInput
          label="API key value"
          type="password"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
          error={valueError ?? undefined}
          placeholder="Enter API key (never shown again)"
          helperText="Store securely. The key is encrypted and never displayed in plain text."
        />
      </div>
    </GlassModal>
  );
}
