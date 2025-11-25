
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type DetailLevel = 'Standard' | 'High' | 'Ultra';
export type Category = 'technical' | 'organic' | 'electronics';
export type GenerationMode = 'text' | 'photo';

export interface GenerationParams {
  objectName: string;
  category: Category;
  aspectRatio: AspectRatio;
  detailLevel: DetailLevel;
  showLabels: boolean;
  isKidFriendly: boolean;
  mode: GenerationMode;
  referenceImage?: string; // base64 data url
  userHint?: string; // Optional user text for photo mode
}

export interface AnalysisResult {
  category: 'technical_product' | 'electronics' | 'organism' | 'unknown';
  canonicalName: string;
  viewpoint: '3/4 front' | '3/4 rear' | 'front' | 'rear' | 'side' | 'top' | 'mixed' | 'unknown';
  mainRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  summary: string;
  confidence: number;
  sensitive: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  params: GenerationParams;
  timestamp: number;
  promptUsed: string;
  parts?: Part[];
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  category: Category;
  params: Partial<GenerationParams>;
  thumbnail?: string;
}

export interface Part {
  id: number;
  name: string;
  system: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
