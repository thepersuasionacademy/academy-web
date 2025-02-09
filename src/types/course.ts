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

export interface MediaItem {
    id?: string;
    media_id?: string;
    content_id?: string;
    type: MediaType;
    title?: string | null;
    description?: string | null;
    order?: number;
    created_at?: string;
    updated_at?: string;
    // Video specific fields
    video_id?: string | null;
    video_name?: VideoNameType | null;
    // Text specific fields
    content_text?: string | null;
    // AI specific fields
    tool_id?: string | null;
    // PDF specific fields
    pdf_url?: string | null;
    pdf_type?: PDFType | null;
    custom_pdf_type?: string | null;
    // Quiz specific fields
    quiz_data?: Record<string, any> | null;
    // UI state fields (not in DB)
    showTypeSelector?: boolean;
    showNameSuggestions?: boolean;
}

export interface Content {
    id?: string;
    collection_id: string;
    title: string;
    description?: string | null;
    status: ContentStatus;
    thumbnail_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Module {
    id?: string;
    content_id?: string;
    title: string;
    description?: string | null;
    order?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Media {
    id?: string;
    module_id?: string;
    content_id?: string;
    title: string;
    description?: string | null;
    order?: number;
    created_at?: string;
    updated_at?: string;
}

export interface VideoContent {
    id: string;
    media_id: string;
    content_id: string;
    title: string;
    video_id: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface TextContent {
    id: string;
    media_id: string;
    content_id: string;
    title: string;
    content_text: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface AIContent {
    id: string;
    media_id: string;
    content_id: string;
    title: string;
    tool_id: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface PDFContent {
    id: string;
    media_id: string;
    content_id: string;
    title: string;
    pdf_url: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface QuizContent {
    id: string;
    media_id: string;
    content_id: string;
    title: string;
    quiz_data: any;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface ContentStats {
    id: string;
    content_id: string;
    enrolled_count: number;
    created_at: string;
    updated_at: string;
}

export interface ContentWithModules extends Content {
    modules: (Module & {
        media: (Media & {
            video?: VideoContent;
            text?: TextContent;
            ai?: AIContent;
            pdf?: PDFContent;
            quiz?: QuizContent;
        })[];
    })[];
} 