import { useState, useEffect } from "react";
import AIBestPracticesModal from "./AIBestPracticesModal";
import { useApp } from "@/contexts/AppContext";

export default function AIBestPracticesGate() {
  const { user } = useApp();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const accepted = localStorage.getItem("adaptly_ai_practices_accepted");
    if (!accepted) {
      // Small delay so the app renders first
      const timer = setTimeout(() => setShowModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!showModal) return null;

  return (
    <AIBestPracticesModal
      onAccept={() => setShowModal(false)}
    />
  );
}
