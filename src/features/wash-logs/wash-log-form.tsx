"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Plus, Save, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type InputHTMLAttributes, useEffect, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  type FieldError,
  type UseFormRegisterReturn,
} from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  IMAGE_UPLOAD_ACCEPT,
  validateImageUploadFile,
  WASH_IMAGE_MAX_SIZE_BYTES,
} from "@/features/uploads/image-upload-policy";
import {
  type PendingWashImageUpload,
  uploadWashImagesForLog,
  WASH_STEP_IMAGE_MAX_COUNT,
} from "@/features/wash-images/wash-image-service";
import type { WashImageType } from "@/features/wash-images/types";

import {
  createWashLogRpcPayload,
  isOwnedCarId,
} from "./wash-log-service";
import { washLogFormSchema, type WashLogFormValues } from "./schemas";

type WashLogFormMode = "create" | "edit";

type CarOption = {
  id: string;
  name: string;
  brand: string;
  model: string;
};

type WashLogFormProps = {
  mode: WashLogFormMode;
  userId: string;
  cars: CarOption[];
  washLogId?: string;
  defaultValues?: WashLogFormValues;
};

type SelectedFormImage = PendingWashImageUpload & {
  id: string;
  previewUrl: string;
};

type WashStepIdRow = {
  id: string;
  step_order: number;
};

const today = new Date().toISOString().slice(0, 10);

const imageTypeOptions: { value: WashImageType; label: string }[] = [
  { value: "before", label: "세차 전" },
  { value: "process", label: "과정" },
  { value: "after", label: "세차 후" },
  { value: "etc", label: "기타" },
];

const emptyValues: WashLogFormValues = {
  carId: "",
  title: "",
  washDate: today,
  location: "",
  durationMinutes: 60,
  cost: 0,
  weather: "",
  dirtLevel: 3,
  satisfaction: 4,
  memo: "",
  visibility: "private",
  steps: [
    {
      stepType: "",
      productName: "",
      memo: "",
      stepOrder: 1,
    },
  ],
};

export function WashLogForm({
  mode,
  userId,
  cars,
  washLogId,
  defaultValues = emptyValues,
}: WashLogFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [imageError, setImageError] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedFormImage[]>([]);
  const [selectedStepImagesByFieldId, setSelectedStepImagesByFieldId] = useState<
    Record<string, SelectedFormImage[]>
  >({});
  const previewUrlsRef = useRef<string[]>([]);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<WashLogFormValues>({
    resolver: zodResolver(washLogFormSchema),
    defaultValues,
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "steps",
  });

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  function handleSelectImages(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const invalidFile = selectedFiles
      .map((file) => validateImageUploadFile(file, WASH_IMAGE_MAX_SIZE_BYTES))
      .find((result) => !result.valid);

    if (invalidFile && !invalidFile.valid) {
      setImageError(invalidFile.error);
      event.target.value = "";
      return;
    }

    const nextImages: SelectedFormImage[] = selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
      file,
      imageType: selectedImages.length === 0 && index === 0 ? "before" : "process",
      isRepresentative: selectedImages.length === 0 && index === 0,
      previewUrl: URL.createObjectURL(file),
    }));

    previewUrlsRef.current = [
      ...previewUrlsRef.current,
      ...nextImages.map((image) => image.previewUrl),
    ];
    setSelectedImages((current) => [...current, ...nextImages]);
    setImageError("");
    event.target.value = "";
  }

  function handleSelectStepImages(fieldId: string, event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const currentImages = selectedStepImagesByFieldId[fieldId] ?? [];

    if (currentImages.length + selectedFiles.length > WASH_STEP_IMAGE_MAX_COUNT) {
      setImageError(`단계별 사진은 최대 ${WASH_STEP_IMAGE_MAX_COUNT}장까지 추가할 수 있습니다.`);
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles
      .map((file) => validateImageUploadFile(file, WASH_IMAGE_MAX_SIZE_BYTES))
      .find((result) => !result.valid);

    if (invalidFile && !invalidFile.valid) {
      setImageError(invalidFile.error);
      event.target.value = "";
      return;
    }

    const nextImages: SelectedFormImage[] = selectedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
      file,
      imageType: "process",
      isRepresentative: false,
      previewUrl: URL.createObjectURL(file),
    }));

    previewUrlsRef.current = [
      ...previewUrlsRef.current,
      ...nextImages.map((image) => image.previewUrl),
    ];
    setSelectedStepImagesByFieldId((current) => ({
      ...current,
      [fieldId]: [...(current[fieldId] ?? []), ...nextImages],
    }));
    setImageError("");
    event.target.value = "";
  }

  function updateSelectedImageType(id: string, imageType: WashImageType) {
    setSelectedImages((current) =>
      current.map((image) => (image.id === id ? { ...image, imageType } : image)),
    );
  }

  function markSelectedImageRepresentative(id: string) {
    setSelectedImages((current) =>
      current.map((image) => ({
        ...image,
        isRepresentative: image.id === id,
      })),
    );
  }

  function removeSelectedImage(id: string) {
    setSelectedImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter(
          (previewUrl) => previewUrl !== image.previewUrl,
        );
      }

      return current.filter((item) => item.id !== id);
    });
  }

  function removeSelectedStepImage(fieldId: string, id: string) {
    setSelectedStepImagesByFieldId((current) => {
      const currentImages = current[fieldId] ?? [];
      const image = currentImages.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter(
          (previewUrl) => previewUrl !== image.previewUrl,
        );
      }

      return {
        ...current,
        [fieldId]: currentImages.filter((item) => item.id !== id),
      };
    });
  }

  function removeStep(index: number, fieldId: string) {
    const stepImages = selectedStepImagesByFieldId[fieldId] ?? [];

    stepImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    previewUrlsRef.current = previewUrlsRef.current.filter(
      (previewUrl) => !stepImages.some((image) => image.previewUrl === previewUrl),
    );
    setSelectedStepImagesByFieldId((current) => {
      const { [fieldId]: _removedImages, ...remainingImages } = current;

      return remainingImages;
    });
    remove(index);
  }

  async function onSubmit(values: WashLogFormValues) {
    setFormError("");
    setImageError("");

    if (!isOwnedCarId(values.carId, cars)) {
      setFormError("현재 계정이 소유한 차량만 세차 기록에 사용할 수 있습니다.");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setFormError("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    if (mode === "create") {
      const payload = createWashLogRpcPayload({ userId, values });
      const { data, error } = await supabase.rpc("create_wash_log_with_steps", payload);

      if (error) {
        setFormError(error.message);
        return;
      }

      if (!data) {
        setFormError("세차 기록 ID를 확인하지 못했습니다.");
        return;
      }

      const selectedStepImageEntries = values.steps.flatMap((_, index) => {
        const fieldId = fields[index]?.id;

        return fieldId
          ? (selectedStepImagesByFieldId[fieldId] ?? []).map((image) => ({
              image,
              stepOrder: index + 1,
            }))
          : [];
      });

      if (selectedImages.length > 0 || selectedStepImageEntries.length > 0) {
        try {
          const stepIdByOrder = new Map<number, string>();

          if (selectedStepImageEntries.length > 0) {
            const { data: stepRows, error: stepError } = await supabase
              .from("wash_steps")
              .select("id,step_order")
              .eq("wash_log_id", data)
              .order("step_order");

            if (stepError) {
              throw new Error(stepError.message);
            }

            (stepRows as WashStepIdRow[] | null)?.forEach((step) => {
              stepIdByOrder.set(step.step_order, step.id);
            });
          }

          const stepImages: PendingWashImageUpload[] = selectedStepImageEntries.map(
            ({ image, stepOrder }) => {
              const washStepId = stepIdByOrder.get(stepOrder);

              if (!washStepId) {
                throw new Error("단계 사진을 연결할 세차 단계 정보를 찾지 못했습니다.");
              }

              return {
                file: image.file,
                imageType: image.imageType,
                isRepresentative: false,
                washStepId,
              };
            },
          );

          await uploadWashImagesForLog(supabase, {
            userId,
            washLogId: data,
            images: [...selectedImages, ...stepImages],
          });
        } catch (uploadError) {
          await supabase.from("wash_logs").delete().eq("id", data).eq("user_id", userId);
          setImageError(
            uploadError instanceof Error ? uploadError.message : "이미지 업로드에 실패했습니다.",
          );
          setFormError("세차 기록은 저장했지만 이미지 업로드에 실패해 저장을 취소했습니다.");
          return;
        }
      }

      router.push(`/wash/${data}`);
      router.refresh();
      return;
    }

    if (!washLogId) {
      setFormError("수정할 세차 기록 정보를 찾지 못했습니다.");
      return;
    }

    const payload = createWashLogRpcPayload({ userId, values });
    const { data, error } = await supabase.rpc("update_wash_log_with_steps", {
      p_wash_log_id: washLogId,
      ...payload,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push(`/wash/${data}`);
    router.refresh();
  }

  return (
    <form
      className="surface-card p-5 sm:p-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      {cars.length === 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          세차 기록을 작성하려면 먼저 차량을 등록해 주세요.
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          차량
          <select
            className="field-control"
            disabled={cars.length === 0}
            {...register("carId")}
          >
            <option value="">차량을 선택해 주세요</option>
            {cars.map((car) => (
              <option value={car.id} key={car.id}>
                {car.name} · {car.brand} {car.model}
              </option>
            ))}
          </select>
          {errors.carId ? (
            <span className="mt-2 block text-sm text-red-700">{errors.carId.message}</span>
          ) : null}
        </label>
        <TextField
          label="제목"
          autoComplete="off"
          error={errors.title}
          registration={register("title")}
        />
        <TextField
          label="세차일"
          type="date"
          error={errors.washDate}
          registration={register("washDate")}
        />
        <TextField
          label="장소"
          autoComplete="off"
          error={errors.location}
          registration={register("location")}
        />
        <TextField
          label="소요 시간(분)"
          type="number"
          min="1"
          max="1440"
          error={errors.durationMinutes}
          registration={register("durationMinutes")}
        />
        <TextField
          label="비용(원)"
          type="number"
          min="0"
          step="100"
          error={errors.cost}
          registration={register("cost")}
        />
        <TextField
          label="날씨"
          autoComplete="off"
          error={errors.weather}
          registration={register("weather")}
        />
        <TextField
          label="오염도(1-5)"
          type="number"
          min="1"
          max="5"
          error={errors.dirtLevel}
          registration={register("dirtLevel")}
        />
        <TextField
          label="만족도(1-5)"
          type="number"
          min="1"
          max="5"
          error={errors.satisfaction}
          registration={register("satisfaction")}
        />
        <label className="block text-sm font-medium">
          공개 범위
          <select
            className="field-control"
            {...register("visibility")}
          >
            <option value="private">비공개</option>
            <option value="public">공개</option>
          </select>
          {errors.visibility ? (
            <span className="mt-2 block text-sm text-red-700">
              {errors.visibility.message}
            </span>
          ) : null}
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium">
        메모
        <textarea
          className="field-control min-h-32 py-3"
          {...register("memo")}
        />
      </label>
      {errors.memo ? (
        <p className="mt-2 text-sm text-red-700">{errors.memo.message}</p>
      ) : null}

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">세차 단계</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              실제 진행한 순서대로 단계를 기록합니다.
            </p>
          </div>
          <button
            className="secondary-action h-10 px-3"
            type="button"
            onClick={() =>
              append({
                stepType: "",
                productName: "",
                memo: "",
                stepOrder: fields.length + 1,
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            단계 추가
          </button>
        </div>

        {typeof errors.steps?.message === "string" ? (
          <p className="mt-3 text-sm text-red-700">{errors.steps.message}</p>
        ) : null}

        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <div className="rounded-2xl border border-border bg-muted/30 p-4" key={field.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">단계 {index + 1}</h3>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => removeStep(index, field.id)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  삭제
                </button>
              </div>
              <input type="hidden" value={index + 1} {...register(`steps.${index}.stepOrder`)} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="단계 유형"
                  autoComplete="off"
                  error={errors.steps?.[index]?.stepType}
                  registration={register(`steps.${index}.stepType`)}
                />
                <TextField
                  label="제품명"
                  autoComplete="off"
                  error={errors.steps?.[index]?.productName}
                  registration={register(`steps.${index}.productName`)}
                />
              </div>
              <label className="mt-4 block text-sm font-medium">
                단계 메모
                <textarea
                  className="field-control min-h-24 py-3"
                  {...register(`steps.${index}.memo`)}
                />
              </label>
              {errors.steps?.[index]?.memo ? (
                <p className="mt-2 text-sm text-red-700">
                  {errors.steps[index]?.memo?.message}
                </p>
              ) : null}
              {mode === "create" ? (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">단계 사진</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        단계별로 최대 {WASH_STEP_IMAGE_MAX_COUNT}장까지 추가할 수 있습니다.
                      </p>
                    </div>
                    <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold shadow-sm transition hover:border-primary">
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      사진 추가
                      <input
                        className="sr-only"
                        type="file"
                        accept={IMAGE_UPLOAD_ACCEPT}
                        multiple
                        onChange={(event) => handleSelectStepImages(field.id, event)}
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                  {(selectedStepImagesByFieldId[field.id] ?? []).length > 0 ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(selectedStepImagesByFieldId[field.id] ?? []).map((image) => (
                        <div className="overflow-hidden rounded-md border border-border bg-white" key={image.id}>
                          <div className="relative aspect-[4/3] bg-muted">
                            <Image
                              src={image.previewUrl}
                              alt={image.file.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 p-2">
                            <p className="truncate text-xs font-semibold">{image.file.name}</p>
                            <button
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              type="button"
                              onClick={() => removeSelectedStepImage(field.id, image.id)}
                              disabled={isSubmitting}
                              aria-label="단계 사진 삭제"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {mode === "create" ? (
        <section className="mt-6 rounded-md border border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">이미지</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                세차 전후, 과정 사진을 기록 생성과 함께 업로드하고 대표 이미지를 지정합니다.
              </p>
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold shadow-sm transition hover:border-primary">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              이미지 선택
              <input
                className="sr-only"
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                multiple
                onChange={handleSelectImages}
                disabled={isSubmitting}
              />
            </label>
          </div>

          {selectedImages.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedImages.map((image) => (
                <div className="overflow-hidden rounded-md border border-border bg-white" key={image.id}>
                  <div className="relative aspect-[4/3] bg-muted">
                    <Image
                      src={image.previewUrl}
                      alt={image.file.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="grid gap-2 p-3">
                    <p className="truncate text-sm font-semibold">{image.file.name}</p>
                    <button
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={() => removeSelectedImage(image.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      삭제
                    </button>
                    <select
                      className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-primary"
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
                    <button
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                      type="button"
                      onClick={() => markSelectedImageRepresentative(image.id)}
                      disabled={image.isRepresentative || isSubmitting}
                    >
                      <Star className="h-4 w-4" aria-hidden="true" />
                      {image.isRepresentative ? "대표 이미지" : "대표로 지정"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {imageError ? <p className="mt-3 text-sm text-red-700">{imageError}</p> : null}
        </section>
      ) : null}

      {formError ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <button
        className="primary-action mt-5 w-full sm:w-auto"
        type="submit"
        disabled={isSubmitting || cars.length === 0}
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

type TextFieldProps = {
  label: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

function TextField({
  label,
  error,
  registration,
  type = "text",
  ...props
}: TextFieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="field-control"
        type={type}
        {...props}
        {...registration}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error.message}</span> : null}
    </label>
  );
}
