export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  profile_image_url: string | null;
}

export interface AccessList {
  id: string;
  name: string;
  description: string | null;
  list_type: 'auto_bundle' | 'auto_variation' | 'custom' | 'combination';
  bundle_id: string | null;
  variation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VariationWithList {
  variationId: string;
  variationName: string;
  list?: AccessList;
  templates?: any[]; // Templates from the bundle_structure table
}

export interface BundleGroup {
  bundleId: string;
  bundleName: string;
  bundleList?: AccessList;
  variations: VariationWithList[];
}

export interface ListMember {
  user_id: string;
  email: string;
  created_at: string;
}

export interface AutoList {
  id: string;
  name: string;
  list_type: string;
  bundle_id?: string;
  variation_id?: string;
  bundle_name?: string;
  variation_name?: string;
} 