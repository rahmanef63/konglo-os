"use client";

import { Modal } from "./modal";
import { AuthForm } from "./auth-form";

// Auth in a dialog (centered) / sheet (mobile bottom). Wraps AuthForm.
export function AuthDialog({
  open,
  onClose,
  demoPassword,
}: {
  open: boolean;
  onClose: () => void;
  demoPassword?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} label="Masuk Konglo OS" className="dark">
      <AuthForm onDone={onClose} demoPassword={demoPassword} />
    </Modal>
  );
}
