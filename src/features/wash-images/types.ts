export type WashImageType = "before" | "after" | "process" | "etc";

export type WashImage = {
  id: string;
  washLogId: string;
  washStepId: string | null;
  objectPath: string;
  imageUrl: string;
  imageType: WashImageType;
  isRepresentative: boolean;
  createdAt: string | null;
};

export type WashImageRow = {
  id: string;
  wash_log_id: string;
  wash_step_id?: string | null;
  object_path?: string | null;
  image_url: string;
  image_type: WashImageType;
  is_representative: boolean;
  created_at: string | null;
};
