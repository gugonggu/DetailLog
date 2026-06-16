import type { WashImage, WashImageRow } from "./types";

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
      image_url: await signWashImageUrl(supabase, row.image_url),
    })),
  );
}

export function mapWashImageRowToWashImage(row: WashImageRow): WashImage {
  return {
    id: row.id,
    washLogId: row.wash_log_id,
    imageUrl: row.image_url,
    imageType: row.image_type,
    isRepresentative: row.is_representative,
    createdAt: row.created_at,
  };
}
