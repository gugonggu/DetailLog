import type { WashImage, WashImageRow, WashImageType } from "./types";

export const WASH_IMAGE_BUCKET = "wash-images";
export const WASH_IMAGE_SIGNED_URL_EXPIRES_IN = 60 * 60;

type WashImageObjectPathInput = {
  userId: string;
  washLogId: string;
  fileName: string;
  timestamp?: number;
  randomId?: string;
};

const publicObjectUrlSegment = `/storage/v1/object/public/${WASH_IMAGE_BUCKET}/`;
const signedObjectUrlSegment = `/storage/v1/object/sign/${WASH_IMAGE_BUCKET}/`;

type SignedUrlSupabaseClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
    };
  };
};

type WashImageCleanupSupabaseClient = {
  from: (table: string) => {
    delete: () => {
      in: (
        column: string,
        values: string[],
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
};

type WashImageUploadSupabaseClient = {
  from: (table: string) => {
    insert: (row: {
      wash_log_id: string;
      object_path: string;
      image_url: string;
      image_type: WashImageType;
      is_representative: boolean;
    }) => {
      select: (columns: string) => {
        single: () => PromiseLike<{
          data: WashImageRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    delete: () => {
      in: (
        column: string,
        values: string[],
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options: { contentType: string; upsert: boolean },
      ) => Promise<{ error: { message: string } | null }>;
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: { message: string } | null;
      }>;
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
};

type PartialWashImageUploadCleanupInput = {
  insertedImageIds: string[];
  uploadedObjectPaths: string[];
};

export type PendingWashImageUpload = {
  file: File;
  imageType: WashImageType;
  isRepresentative: boolean;
};

type UploadWashImagesForLogInput = {
  userId: string;
  washLogId: string;
  images: PendingWashImageUpload[];
  hasRepresentative?: boolean;
  timestamp?: number;
  randomId?: () => string;
};

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();

  return extension && extension !== fileName.toLowerCase() ? extension : "jpg";
}

export function createWashImageObjectPath({
  userId,
  washLogId,
  fileName,
  timestamp = Date.now(),
  randomId = crypto.randomUUID(),
}: WashImageObjectPathInput) {
  const extension = getFileExtension(fileName);

  return `${userId}/${washLogId}/${timestamp}-${randomId}.${extension}`;
}

export function getWashImageStoragePath(imageUrl: string) {
  if (!imageUrl.startsWith("http") && imageUrl.includes("/")) {
    return imageUrl;
  }

  const [, publicPath] = imageUrl.split(publicObjectUrlSegment);

  if (publicPath) {
    return decodeURIComponent(publicPath.split("?")[0] ?? "");
  }

  const [, signedPath] = imageUrl.split(signedObjectUrlSegment);

  return signedPath ? decodeURIComponent(signedPath.split("?")[0] ?? "") : "";
}

export async function signWashImageUrl(
  supabase: SignedUrlSupabaseClient,
  imageUrl: string,
  expiresIn = WASH_IMAGE_SIGNED_URL_EXPIRES_IN,
) {
  const objectPath = getWashImageStoragePath(imageUrl);

  if (!objectPath) {
    return imageUrl;
  }

  const { data, error } = await supabase.storage
    .from(WASH_IMAGE_BUCKET)
    .createSignedUrl(objectPath, expiresIn);

  if (error || !data?.signedUrl) {
    return imageUrl;
  }

  return data.signedUrl;
}

export async function signWashImages<T extends WashImage>(
  supabase: SignedUrlSupabaseClient,
  images: T[],
) {
  return Promise.all(
    images.map(async (image) => ({
      ...image,
      imageUrl: await signWashImageUrl(supabase, image.imageUrl),
    })),
  );
}

export async function signWashImageRows<T extends WashImageRow>(
  supabase: SignedUrlSupabaseClient,
  rows: T[],
) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      image_url: await signWashImageUrl(supabase, row.object_path ?? row.image_url),
    })),
  );
}

export async function cleanupPartialWashImageUpload(
  supabase: WashImageCleanupSupabaseClient,
  { insertedImageIds, uploadedObjectPaths }: PartialWashImageUploadCleanupInput,
) {
  if (insertedImageIds.length > 0) {
    await supabase.from("wash_images").delete().in("id", insertedImageIds);
  }

  if (uploadedObjectPaths.length > 0) {
    await supabase.storage.from(WASH_IMAGE_BUCKET).remove(uploadedObjectPaths);
  }
}

export async function uploadWashImagesForLog(
  supabase: WashImageUploadSupabaseClient,
  {
    userId,
    washLogId,
    images,
    hasRepresentative = false,
    timestamp,
    randomId = () => crypto.randomUUID(),
  }: UploadWashImagesForLogInput,
) {
  const uploadedImages: WashImage[] = [];
  const uploadedObjectPaths: string[] = [];
  const insertedImageIds: string[] = [];
  const hasSelectedRepresentative = images.some((image) => image.isRepresentative);

  for (const [index, image] of images.entries()) {
    const objectPath = createWashImageObjectPath({
      userId,
      washLogId,
      fileName: image.file.name,
      timestamp,
      randomId: randomId(),
    });

    const { error: uploadError } = await supabase.storage
      .from(WASH_IMAGE_BUCKET)
      .upload(objectPath, image.file, {
        contentType: image.file.type,
        upsert: false,
      });

    if (uploadError) {
      await cleanupPartialWashImageUpload(supabase, {
        insertedImageIds,
        uploadedObjectPaths,
      });
      throw new Error(uploadError.message);
    }

    uploadedObjectPaths.push(objectPath);

    const { data: signedUrlData } = await supabase.storage
      .from(WASH_IMAGE_BUCKET)
      .createSignedUrl(objectPath, WASH_IMAGE_SIGNED_URL_EXPIRES_IN);

    const shouldBeRepresentative =
      image.isRepresentative || (!hasRepresentative && !hasSelectedRepresentative && index === 0);
    const { data: insertedImage, error: insertError } = await supabase
      .from("wash_images")
      .insert({
        wash_log_id: washLogId,
        object_path: objectPath,
        image_url: objectPath,
        image_type: image.imageType,
        is_representative: shouldBeRepresentative,
      })
      .select("id,wash_log_id,object_path,image_url,image_type,is_representative,created_at")
      .single();

    if (insertError || !insertedImage) {
      await cleanupPartialWashImageUpload(supabase, {
        insertedImageIds,
        uploadedObjectPaths,
      });
      throw new Error(insertError?.message ?? "이미지 저장에 실패했습니다.");
    }

    insertedImageIds.push(insertedImage.id);

    uploadedImages.push({
      ...mapWashImageRowToWashImage(insertedImage),
      imageUrl: signedUrlData?.signedUrl ?? insertedImage.image_url,
    });
  }

  return uploadedImages;
}

export function mapWashImageRowToWashImage(row: WashImageRow): WashImage {
  return {
    id: row.id,
    washLogId: row.wash_log_id,
    objectPath: row.object_path ?? getWashImageStoragePath(row.image_url),
    imageUrl: row.image_url,
    imageType: row.image_type,
    isRepresentative: row.is_representative,
    createdAt: row.created_at,
  };
}
