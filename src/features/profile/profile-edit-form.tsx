"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  AVATAR_IMAGE_MAX_SIZE_BYTES,
  IMAGE_UPLOAD_ACCEPT,
  validateImageUploadFile,
} from "@/features/uploads/image-upload-policy";

import {
  AVATAR_BUCKET,
  createAvatarObjectPath,
  createProfileUpsertPayload,
  getAvatarStoragePath,
  prepareProfileUpdate,
} from "./profile-service";
import { profileFormSchema, type ProfileFormValues } from "./schemas";

type ProfileEditFormProps = {
  userId: string;
  email: string;
  initialNickname: string;
  initialAvatarUrl: string | null;
  profileExists: boolean;
};

export function ProfileEditForm({
  userId,
  email,
  initialNickname,
  initialAvatarUrl,
  profileExists,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const previewUrlRef = useRef("");

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: initialNickname,
    },
  });

  const displayedAvatarUrl = avatarPreviewUrl || initialAvatarUrl;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function handleSelectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    if (!file) {
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      previewUrlRef.current = "";
      event.target.value = "";
      return;
    }

    const validation = validateImageUploadFile(file, AVATAR_IMAGE_MAX_SIZE_BYTES);

    if (!validation.valid) {
      setAvatarFile(null);
      setAvatarPreviewUrl("");
      previewUrlRef.current = "";
      setFormError(validation.error);
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarPreviewUrl(previewUrl);
    setFormError("");
    setSuccessMessage("");
    event.target.value = "";
  }

  async function uploadAvatar() {
    if (!avatarFile) {
      return {
        avatarUrl: initialAvatarUrl,
        objectPath: "",
        error: "",
      };
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return {
        avatarUrl: initialAvatarUrl,
        objectPath: "",
        error: "Supabase 환경 변수를 먼저 설정해 주세요.",
      };
    }

    const objectPath = createAvatarObjectPath({
      userId,
      fileName: avatarFile.name,
    });

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(objectPath, avatarFile, {
        contentType: avatarFile.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        avatarUrl: initialAvatarUrl,
        objectPath: "",
        error: uploadError.message,
      };
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);

    return {
      avatarUrl: data.publicUrl,
      objectPath,
      error: "",
    };
  }

  async function onSubmit(values: ProfileFormValues) {
    setFormError("");
    setSuccessMessage("");

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    const uploadedAvatar = await uploadAvatar();

    if (uploadedAvatar.error) {
      setFormError(uploadedAvatar.error);
      return;
    }

    const avatarUrl = uploadedAvatar.avatarUrl;
    const request = profileExists
      ? supabase
          .from("profiles")
          .update(prepareProfileUpdate({ ...values, avatarUrl }))
          .eq("id", userId)
      : supabase.from("profiles").upsert(
          createProfileUpsertPayload({
            userId,
            email,
            nickname: values.nickname,
            avatarUrl,
          }),
          { onConflict: "id" },
        );

    const { error } = await request;

    if (error) {
      if (uploadedAvatar.objectPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadedAvatar.objectPath]);
      }
      setFormError(error.message);
      return;
    }

    const previousAvatarPath = getAvatarStoragePath(initialAvatarUrl);

    if (uploadedAvatar.objectPath && previousAvatarPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setAvatarFile(null);
    setAvatarPreviewUrl("");
    setSuccessMessage("프로필을 저장했습니다.");
    router.refresh();
  }

  return (
    <form className="surface-card p-5 sm:p-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <h2 className="text-lg font-semibold">프로필 수정</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Detailog에서 표시할 닉네임과 아바타를 수정합니다.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
          {displayedAvatarUrl ? (
            <Image
              src={displayedAvatarUrl}
              alt="프로필 아바타 미리보기"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          ) : (
            <ImagePlus className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
        <div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-primary">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            아바타 선택
            <input
              className="sr-only"
              type="file"
              accept={IMAGE_UPLOAD_ACCEPT}
              onChange={handleSelectAvatar}
              disabled={isSubmitting}
            />
          </label>
          {avatarFile ? (
            <p className="mt-2 max-w-56 truncate text-xs text-muted-foreground">
              {avatarFile.name}
            </p>
          ) : null}
        </div>
      </div>

      <label className="mt-5 block text-sm font-medium">
        닉네임
        <input
          className="field-control"
          type="text"
          autoComplete="nickname"
          {...register("nickname")}
        />
      </label>
      {errors.nickname ? (
        <p className="mt-2 text-sm text-red-700">{errors.nickname.message}</p>
      ) : null}

      {formError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        className="primary-action mt-5 w-full sm:w-auto"
        type="submit"
        disabled={isSubmitting}
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
