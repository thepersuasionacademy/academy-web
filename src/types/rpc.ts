import { Collection } from './content';

export type GetContentCollectionsParams = Record<string, never>;
export type GetContentCollectionsResult = Collection[];

export interface CreateContentCollectionParams {
  p_name: string;
  p_description: string | null;
}
export type CreateContentCollectionResult = Collection; 