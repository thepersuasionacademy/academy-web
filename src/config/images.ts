// Temporary mock data - will be replaced with DynamoDB data
export const SUITE_IMAGES = {
  DEFAULT_BANNER: "https://thepersuasionacademy-com.b-cdn.net/Images/thepowerark_epic_visual_of_silhouette_person_standing_on_foun_8561edf9-c270-4a29-8db4-1293cd4a2945_2.jpeg",
  FALLBACK_BANNER: "/images/default-suite-banner.jpg",
} as const;

// These configurations should stay as they're app-specific
export const IMAGE_DIMENSIONS = {
  SUITE_BANNER: {
    width: 1920,
    height: 1080,
    aspectRatio: "16/9",
  }
} as const;

// Future implementation example:
export interface SuiteImage {
  id: string;
  url: string;
  alt: string;
  type: 'banner' | 'thumbnail';
}

// This will be the future function to get images from DynamoDB
export async function getSuiteImages(suiteId: string): Promise<SuiteImage[]> {
  // TODO: Implement DynamoDB query
  return [];
} 