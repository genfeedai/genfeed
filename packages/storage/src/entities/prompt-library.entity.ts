export interface StyleSettingsData {
  mood?: string;
  style?: string;
  camera?: string;
  lighting?: string;
  scene?: string;
}

export interface PromptLibraryItemEntity {
  id: string;
  name: string;
  description: string;
  promptText: string;
  styleSettings: StyleSettingsData;
  aspectRatio: string;
  preferredModel?: string;
  category: string;
  tags: string[];
  useCount: number;
  isFeatured: boolean;
  thumbnail?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptData {
  name: string;
  description?: string;
  promptText: string;
  styleSettings?: StyleSettingsData;
  aspectRatio?: string;
  preferredModel?: string;
  category?: string;
  tags?: string[];
  isFeatured?: boolean;
  thumbnail?: string;
}

export interface UpdatePromptData extends Partial<CreatePromptData> {}
