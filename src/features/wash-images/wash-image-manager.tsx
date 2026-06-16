"use client";

import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  IMAGE_UPLOAD_ACCEPT,
  validateImageUploadFile,
  WASH_IMAGE_MAX_SIZE_BYTES,
} from "@/features/uploads/image-upload-policy";

import {
  createWashImageObjectPath,
  getWashImageStoragePath,
  WASH_IMAGE_BUCKET,
} from "./wash-image-service";
import type { WashImage, WashImageType } from "./types";

type WashImageManagerProps = {
  userId: string;
  washLogId: string;
  initialImages: WashImage[];
};

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
  imageType: WashImageType;
};

const imageTypeOptions: { value: WashImageType; label: string }[] = [
  { value: "before", label: "세차 전" },
  { value: "after", label: "세차 후" },
  { value: "process", label: "과정" },
  { value: "etc", label: "기타" },
];

const imageTypeLabels: Record<WashImageType, string> = {
  before: "세차 전",
  after: "세차 후",
  process: "과정",
  etc: "기타",
};

export function WashImageManager({
  userId,
  washLogId,
  initialImages,
}: WashImageManagerProps) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState("");
  const previewUrlsRef = useRef<string[]>([]);

  const hasRepresentative = useMemo(
    () => images.some((image) => image.isRepresentative),
    [images],
  );

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const invalidFile = selectedFiles
      .map((file) => validateImageUploadFile(file, WASH_IMAGE_MAX_SIZE_BYTES))
      .find((result) => !result.valid);

    if (invalidFile && !invalidFile.valid) {
      setSelectedImages([]);
      setErrorMessage(invalidFile.error);
      event.target.value = "";
      return;
    }

    const files = selectedFiles;

    previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));

    const nextImages: SelectedImage[] = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      previewUrl: URL.createObjectURL(file),
      imageType: "process",
    }));

    previewUrlsRef.current = nextImages.map((image) => image.previewUrl);
    setSelectedImages(nextImages);
    setErrorMessage("");
    event.target.value = "";
  }

  function updateSelectedImageType(id: string, imageType: WashImageType) {
    setSelectedImages((current) =>
      current.map((image) => (image.id === id ? { ...image, imageType } : image)),
    );
  }

  async function ensureOwnedWashLog() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return {
        supabase: null,
        error: "이미지를 업로드하려면 Supabase 환경 변수가 필요합니다.",
      };
    }

    const { data, error } = await supabase
      .from("wash_logs")
      .select("id")
      .eq("id", washLogId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { supabase: null, error: error.message };
    }

    if (!data) {
      return { supabase: null, error: "내 세차 기록의 이미지만 관리할 수 있습니다." };
    }

    return { supabase, error: "" };
  }

  async function handleUpload() {
    if (selectedImages.length === 0) {
      setErrorMessage("업로드할 이미지를 하나 이상 선택해주세요.");
      return;
    }

    setErrorMessage("");
    setIsUploading(true);

    const { supabase, error } = await ensureOwnedWashLog();

    if (!supabase) {
      setErrorMessage(error);
      setIsUploading(false);
      return;
    }

    const uploadedImages: WashImage[] = [];

    for (const [index, selectedImage] of selectedImages.entries()) {
      const objectPath = createWashImageObjectPath({
        userId,
        washLogId,
        fileName: selectedImage.file.name,
      });

      const { error: uploadError } = await supabase.storage
        .from(WASH_IMAGE_BUCKET)
        .upload(objectPath, selectedImage.file, {
          contentType: selectedImage.file.type,
          upsert: false,
        });

      if (uploadError) {
        setErrorMessage(uploadError.message);
        setIsUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(WASH_IMAGE_BUCKET)
        .getPublicUrl(objectPath);
      const { data: signedUrlData } = await supabase.storage
        .from(WASH_IMAGE_BUCKET)
        .createSignedUrl(objectPath, 60 * 60);

      const shouldBeRepresentative = !hasRepresentative && index === 0;
      const { data: insertedImage, error: insertError } = await supabase
        .from("wash_images")
        .insert({
          wash_log_id: washLogId,
          image_url: publicUrlData.publicUrl,
          image_type: selectedImage.imageType,
          is_representative: shouldBeRepresentative,
        })
        .select("id,wash_log_id,image_url,image_type,is_representative,created_at")
        .single();

      if (insertError) {
        await supabase.storage.from(WASH_IMAGE_BUCKET).remove([objectPath]);
        setErrorMessage(insertError.message);
        setIsUploading(false);
        return;
      }

      uploadedImages.push({
        id: insertedImage.id,
        washLogId: insertedImage.wash_log_id,
        imageUrl: signedUrlData?.signedUrl ?? insertedImage.image_url,
        imageType: insertedImage.image_type,
        isRepresentative: insertedImage.is_representative,
        createdAt: insertedImage.created_at,
      });
    }

    previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    previewUrlsRef.current = [];
    setSelectedImages([]);
    setImages((current) => [...uploadedImages, ...current]);
    setIsUploading(false);
    router.refresh();
  }

  async function handleDelete(image: WashImage) {
    const confirmed = window.confirm("이 세차 이미지를 삭제할까요?");

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setBusyImageId(image.id);

    const { supabase, error } = await ensureOwnedWashLog();

    if (!supabase) {
      setErrorMessage(error);
      setBusyImageId("");
      return;
    }

    const objectPath = getWashImageStoragePath(image.imageUrl);

    if (!objectPath) {
      setErrorMessage("이미지의 스토리지 경로를 찾지 못했습니다.");
      setBusyImageId("");
      return;
    }

    const { error: storageError } = await supabase.storage
      .from(WASH_IMAGE_BUCKET)
      .remove([objectPath]);

    if (storageError) {
      setErrorMessage(storageError.message);
      setBusyImageId("");
      return;
    }

    const { error: deleteError } = await supabase
      .from("wash_images")
      .delete()
      .eq("id", image.id)
      .eq("wash_log_id", washLogId);

    if (deleteError) {
      setErrorMessage(deleteError.message);
      setBusyImageId("");
      return;
    }

    setImages((current) => current.filter((currentImage) => currentImage.id !== image.id));
    setBusyImageId("");
    router.refresh();
  }

  async function handleMarkRepresentative(image: WashImage) {
    setErrorMessage("");
    setBusyImageId(image.id);

    const { supabase, error } = await ensureOwnedWashLog();

    if (!supabase) {
      setErrorMessage(error);
      setBusyImageId("");
      return;
    }

    const { error: resetError } = await supabase
      .from("wash_images")
      .update({ is_representative: false })
      .eq("wash_log_id", washLogId);

    if (resetError) {
      setErrorMessage(resetError.message);
      setBusyImageId("");
      return;
    }

    const { error: updateError } = await supabase
      .from("wash_images")
      .update({ is_representative: true })
      .eq("id", image.id)
      .eq("wash_log_id", washLogId);

    if (updateError) {
      setErrorMessage(updateError.message);
      setBusyImageId("");
      return;
    }

    setImages((current) =>
      current.map((currentImage) => ({
        ...currentImage,
        isRepresentative: currentImage.id === image.id,
      })),
    );
    setBusyImageId("");
    router.refresh();
  }

  return (
    <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">세차 이미지</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            세차 전후와 작업 과정을 사진으로 남겨 기록의 완성도를 높입니다.
          </p>
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-primary">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          이미지 선택
          <input
            className="sr-only"
            type="file"
            accept={IMAGE_UPLOAD_ACCEPT}
            multiple
            onChange={handleSelectFiles}
            disabled={isUploading}
          />
        </label>
      </div>

      {selectedImages.length > 0 ? (
        <div className="mt-5 rounded-md border border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold">선택한 이미지</h3>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isUploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedImages.map((image) => (
              <div className="overflow-hidden rounded-md border border-border" key={image.id}>
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={image.previewUrl}
                    alt={image.file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{image.file.name}</p>
                  <select
                    className="mt-3 h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
                    value={image.imageType}
                    onChange={(event) =>
                      updateSelectedImageType(image.id, event.target.value as WashImageType)
                    }
                  >
                    {imageTypeOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {images.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          아직 업로드한 세차 이미지가 없습니다.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <article className="overflow-hidden rounded-md border border-border" key={image.id}>
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={image.imageUrl}
                  alt={`${imageTypeLabels[image.imageType]} wash image`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  unoptimized
                />
                {image.isRepresentative ? (
                  <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                    대표 이미지
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {imageTypeLabels[image.imageType]}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={() => handleMarkRepresentative(image)}
                      disabled={busyImageId === image.id || image.isRepresentative}
                      aria-label="대표 이미지로 지정"
                    >
                      <Star className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={() => handleDelete(image)}
                      disabled={busyImageId === image.id}
                      aria-label="이미지 삭제"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
