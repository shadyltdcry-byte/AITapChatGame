export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: string;
  url: string;
  path: string;
  characterId: string | null;
  uploadedBy: string;
  tags: string[];
  description: string | null;
  isNsfw: boolean;
  requiredLevel: number | null;
  isWheelReward: boolean | null;
  chatSendChance: number | null;
  isVipOnly: boolean | null;
  isEventOnly: boolean | null;
  createdAt: Date;
}