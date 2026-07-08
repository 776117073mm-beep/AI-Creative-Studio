import {
  BaseEngine,
  EngineConfigSchema,
  EventBus,
  globalEventBus,
  AssetId,
  MediaType,
  EventEmitter,
} from '@ai-creative-studio/core';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const AssetEngineConfigSchema = EngineConfigSchema.extend({
  maxStorageSize: z.number().optional().default(5 * 1024 * 1024 * 1024),
  supportedFormats: z.record(z.array(z.string())).optional(),
  basePath: z.string().optional().default('/assets'),
});

type AssetEngineConfig = z.infer<typeof AssetEngineConfigSchema>;

export interface IAsset {
  id: AssetId;
  name: string;
  type: MediaType;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  audioChannels?: number;
  sampleRate?: number;
  format: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  folderId?: string;
  metadata?: Record<string, unknown>;
  processingStatus: AssetProcessingStatus;
  processingProgress?: number;
}

export type AssetProcessingStatus =
  | 'pending'
  | 'processing'
  | 'complete'
  | 'failed';

export interface IAssetFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
  children: string[];
}

export interface IAssetUploadOptions {
  folderId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  generateThumbnail?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (asset: IAsset) => void;
  onError?: (error: Error) => void;
}

export interface ISearchParams {
  query?: string;
  type?: MediaType | MediaType[];
  tags?: string[];
  folderId?: string;
  startDate?: number;
  endDate?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface IAssetEvents {
  'asset:uploaded': { asset: IAsset };
  'asset:removed': { assetId: AssetId };
  'asset:updated': { asset: IAsset };
  'asset:processing-start': { assetId: AssetId };
  'asset:processing-progress': { assetId: AssetId; progress: number };
  'asset:processing-complete': { asset: IAsset };
  'asset:processing-error': { assetId: AssetId; error: Error };
  'folder:created': { folder: IAssetFolder };
  'folder:removed': { folderId: string };
}

const SUPPORTED_FORMATS: Record<MediaType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
  video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'prores', 'hevc'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'aiff'],
  font: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
  document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  project: ['json', 'zip'],
  template: ['json'],
  brush: ['abr', 'tpl'],
  preset: ['json', 'preset'],
};

export class AssetEngine extends BaseEngine {
  private assets: Map<AssetId, IAsset> = new Map();
  private folders: Map<string, IAssetFolder> = new Map();
  private emitter = new EventEmitter<IAssetEvents>();
  private maxStorageSize: number;
  private basePath: string;
  private currentStorageSize: number = 0;
  private supportedFormats: Record<MediaType, string[]>;

  constructor(config: AssetEngineConfig) {
    const parsedConfig = AssetEngineConfigSchema.parse(config);
    super(parsedConfig);
    this.maxStorageSize = parsedConfig.maxStorageSize!;
    this.basePath = parsedConfig.basePath!;
    this.supportedFormats = parsedConfig.supportedFormats ?? SUPPORTED_FORMATS;
  }

  protected async onInitialize(): Promise<void> {
    this.createFolder('root', 'All Assets');
  }

  protected override async onDestroy(): Promise<void> {
    this.assets.clear();
    this.folders.clear();
    this.currentStorageSize = 0;
  }

  async uploadFile(
    file: File,
    options?: IAssetUploadOptions
  ): Promise<IAsset> {
    if (!this.canAcceptFile(file)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    const type = this.getMediaType(file.type, file.name);
    const assetId = uuidv4() as AssetId;

    const asset: IAsset = {
      id: assetId,
      name: file.name,
      type,
      size: file.size,
      mimeType: file.type,
      url: URL.createObjectURL(file),
      format: this.getFormat(file.name),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: options?.tags || [],
      folderId: options?.folderId,
      metadata: options?.metadata,
      processingStatus: 'pending',
    };

    this.assets.set(asset.id, asset);
    this.currentStorageSize += file.size;

    this.emitter.emit('asset:uploaded', { asset });

    this.processAsset(asset.id, file, options);

    return asset;
  }

  async uploadFiles(
    files: File[],
    options?: IAssetUploadOptions
  ): Promise<IAsset[]> {
    const results: IAsset[] = [];

    for (const file of files) {
      try {
        const asset = await this.uploadFile(file, options);
        results.push(asset);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    return results;
  }

  private async processAsset(
    assetId: AssetId,
    file: File,
    options?: IAssetUploadOptions
  ): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) return;

    this.emitter.emit('asset:processing-start', { assetId });
    asset.processingStatus = 'processing';

    try {
      if (asset.type === 'image') {
        await this.processImageAsset(asset, file);
      } else if (asset.type === 'video') {
        await this.processVideoAsset(asset, file);
      } else if (asset.type === 'audio') {
        await this.processAudioAsset(asset, file);
      }

      asset.processingStatus = 'complete';
      asset.updatedAt = Date.now();

      this.emitter.emit('asset:processing-complete', { asset });
      options?.onComplete?.(asset);

      if (options?.generateThumbnail !== false && asset.type === 'image') {
        await this.generateThumbnail(asset, file);
      }
    } catch (error) {
      asset.processingStatus = 'failed';
      const err = error instanceof Error ? error : new Error(String(error));
      this.emitter.emit('asset:processing-error', { assetId, error: err });
      options?.onError?.(err);
    }
  }

  private async processImageAsset(asset: IAsset, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        asset.width = img.naturalWidth;
        asset.height = img.naturalHeight;
        resolve();
      };
      img.onerror = reject;
      img.src = asset.url;
    });
  }

  private async processVideoAsset(asset: IAsset, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        asset.width = video.videoWidth;
        asset.height = video.videoHeight;
        asset.duration = video.duration;
        resolve();
      };
      video.onerror = reject;
      video.src = asset.url;
    });
  }

  private async processAudioAsset(asset: IAsset, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        asset.duration = audio.duration;
        resolve();
      };
      audio.onerror = reject;
      audio.src = asset.url;
    });
  }

  private async generateThumbnail(asset: IAsset, file: File): Promise<void> {
    if (asset.type === 'image') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = asset.url;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const maxSize = 256;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      asset.thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
    }
  }

  removeAsset(assetId: AssetId): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    if (asset.url.startsWith('blob:')) {
      URL.revokeObjectURL(asset.url);
    }

    this.currentStorageSize -= asset.size;
    this.assets.delete(assetId);
    this.emitter.emit('asset:removed', { assetId });

    return true;
  }

  getAsset(assetId: AssetId): IAsset | undefined {
    return this.assets.get(assetId);
  }

  getAllAssets(): IAsset[] {
    return Array.from(this.assets.values());
  }

  searchAssets(params: ISearchParams): IAsset[] {
    let results = this.getAllAssets();

    if (params.query) {
      const query = params.query.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    if (params.type) {
      const types = Array.isArray(params.type) ? params.type : [params.type];
      results = results.filter(a => types.includes(a.type));
    }

    if (params.tags && params.tags.length > 0) {
      results = results.filter(a =>
        params.tags!.some(t => a.tags.includes(t))
      );
    }

    if (params.folderId) {
      results = results.filter(a => a.folderId === params.folderId);
    }

    if (params.startDate) {
      results = results.filter(a => a.createdAt >= params.startDate!);
    }

    if (params.endDate) {
      results = results.filter(a => a.createdAt <= params.endDate!);
    }

    if (params.sortBy) {
      const order = params.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        switch (params.sortBy) {
          case 'name':
            return order * a.name.localeCompare(b.name);
          case 'createdAt':
            return order * (a.createdAt - b.createdAt);
          case 'updatedAt':
            return order * (a.updatedAt - b.updatedAt);
          case 'size':
            return order * (a.size - b.size);
          default:
            return 0;
        }
      });
    }

    if (params.offset !== undefined || params.limit !== undefined) {
      const offset = params.offset ?? 0;
      const limit = params.limit ?? results.length;
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  createFolder(name: string, parentId?: string): IAssetFolder {
    const folder: IAssetFolder = {
      id: uuidv4(),
      name,
      parentId,
      createdAt: Date.now(),
      children: [],
    };

    this.folders.set(folder.id, folder);

    if (parentId) {
      const parent = this.folders.get(parentId);
      if (parent) {
        parent.children.push(folder.id);
      }
    }

    if (name !== 'root') {
      this.emitter.emit('folder:created', { folder });
    }

    return folder;
  }

  removeFolder(folderId: string, deleteContents: boolean = false): void {
    const folder = this.folders.get(folderId);
    if (!folder) return;

    if (deleteContents) {
      for (const childId of folder.children) {
        this.removeFolder(childId, true);
      }

      const assetsToRemove = Array.from(this.assets.values())
        .filter(a => a.folderId === folderId);

      for (const asset of assetsToRemove) {
        this.removeAsset(asset.id);
      }
    } else {
      for (const childId of folder.children) {
        const child = this.folders.get(childId);
        if (child) {
          child.parentId = folder.parentId;
        }
      }

      const parent = folder.parentId ? this.folders.get(folder.parentId) : null;
      if (parent) {
        parent.children = parent.children.filter(id => id !== folderId);
        parent.children.push(...folder.children);
      }
    }

    this.folders.delete(folderId);
    this.emitter.emit('folder:removed', { folderId });
  }

  getFolder(folderId: string): IAssetFolder | undefined {
    return this.folders.get(folderId);
  }

  getRootFolders(): IAssetFolder[] {
    const root = this.folders.values().next().value as IAssetFolder;
    return root ? this.getChildFolders(root.id) : [];
  }

  getChildFolders(folderId: string): IAssetFolder[] {
    const parent = this.folders.get(folderId);
    if (!parent) return [];

    return parent.children
      .map(id => this.folders.get(id))
      .filter((f): f is IAssetFolder => f !== undefined);
  }

  getAssetsInFolder(folderId: string): IAsset[] {
    return this.getAllAssets().filter(a => a.folderId === folderId);
  }

  canAcceptFile(file: File): boolean {
    const type = this.getMediaType(file.type, file.name);
    const format = this.getFormat(file.name);
    return this.supportedFormats[type]?.includes(format) ?? false;
  }

  private getMediaType(mimeType: string, filename: string): MediaType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('font')) return 'font';
    if (mimeType.includes('pdf')) return 'document';

    const ext = this.getFormat(filename).toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'font';

    return 'document';
  }

  private getFormat(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  getStorageInfo(): { used: number; total: number; available: number } {
    return {
      used: this.currentStorageSize,
      total: this.maxStorageSize,
      available: this.maxStorageSize - this.currentStorageSize,
    };
  }

  on<E extends keyof IAssetEvents>(
    event: E,
    listener: (data: IAssetEvents[E]) => void
  ): this {
    this.emitter.on(event, listener as any);
    return this;
  }

  off<E extends keyof IAssetEvents>(
    event: E,
    listener: (data: IAssetEvents[E]) => void
  ): this {
    this.emitter.off(event, listener as any);
    return this;
  }

  getCapabilities(): string[] {
    return [
      'asset:upload',
      'asset:upload-multiple',
      'asset:search',
      'asset:folders',
      'asset:thumbnails',
      'asset:metadata',
      'asset:processing',
      'asset:storage-management',
    ];
  }
}
