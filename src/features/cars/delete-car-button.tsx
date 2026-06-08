"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type DeleteCarButtonProps = {
  carId: string;
  userId: string;
};

export function DeleteCarButton({ carId, userId }: DeleteCarButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("이 차량을 삭제할까요?");

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setIsDeleting(true);

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setErrorMessage("Supabase 환경 변수를 먼저 설정해 주세요.");
      setIsDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("cars")
      .delete()
      .eq("id", carId)
      .eq("user_id", userId);

    if (error) {
      setErrorMessage(error.message);
      setIsDeleting(false);
      return;
    }

    router.push("/cars");
    router.refresh();
  }

  return (
    <div>
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {isDeleting ? "삭제 중..." : "삭제"}
      </button>
      {errorMessage ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
