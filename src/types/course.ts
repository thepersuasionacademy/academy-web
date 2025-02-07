export enum PlayerView {
    BAR = 'BAR',
    FULLSCREEN = 'FULLSCREEN',
    PIP = 'PIP'
}

export interface PlayerState {
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
}

export enum ContentStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
}

export enum MediaType {
    VIDEO = 'VIDEO',
    TEXT = 'TEXT',
    AI = 'AI',
    PDF = 'PDF',
    QUIZ = 'QUIZ'
}

export enum VideoNameType {
    VIDEO = 'VIDEO',
    LESSON = 'LESSON',
    IMPRINTING_SESSION = 'IMPRINTING_SESSION'
}

export enum PDFType {
    TRANSCRIPT = 'TRANSCRIPT',
    NOTES = 'NOTES',
    CUSTOM = 'CUSTOM'
}

export interface Content {
    id: string;
    collection_id: string;
    title: string;
    description: string;
    status: ContentStatus;
    thumbnail?: string;
    created_at: string;
    updated_at: string;
}

export interface Module {
    id: string;
    content_id: string;
    title: string;
    description: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface Media {
    id: string;
    module_id: string;
    title: string;
    description: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface MediaItem {
    id: string;
    media_id: string;
    type: MediaType;
    title: string;
    description?: string;
    order: number;
    // Video specific fields
    video_id?: string;
    video_name?: string;
    showPreview?: boolean;
    showNameSuggestions?: boolean;
    showTypeSelector?: boolean;
    // Text specific fields
    content_text?: string;
    // AI specific fields
    tool_id?: string;
    // PDF specific fields
    pdf_url?: string;
    pdf_type?: PDFType;
    custom_pdf_type?: string;
    // Quiz specific fields
    quiz_data?: any;
    created_at: string;
    updated_at: string;
}

export interface ContentWithModules extends Content {
    modules: (Module & {
        media: (Media & {
            items: MediaItem[];
        })[];
    })[];
} 