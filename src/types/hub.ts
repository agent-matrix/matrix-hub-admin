// src/types/hub.ts
export type SearchMode = "keyword" | "semantic" | "hybrid";
export type RerankMode = "none" | "llm";

export interface SearchItem {
  id: string;
  type: string;
  name: string;
  version: string;
  summary?: string;
  capabilities: string[];
  frameworks: string[];
  providers: string[];
  score_final?: number;
  score_lexical?: number;
  score_semantic?: number;
  score_quality?: number;
  score_recency?: number;
  fit_reason?: string | null;
}

export interface SearchResponse { items: SearchItem[]; total: number }

export interface EntityDetail {
  id: string;
  type: string;
  name: string;
  version: string;
  summary?: string | null;
  description?: string | null;
  capabilities: string[];
  frameworks: string[];
  providers: string[];
  license?: string | null;
  homepage?: string | null;
  source_url?: string | null;
  quality_score?: number;
  release_ts?: string | null;
  readme_blob_ref?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstallRequest {
  id: string;
  target: string;
  version?: string | null;
  manifest?: Record<string, any> | null;
  source_url?: string | null;
}

export interface InstallResponse {
  plan?: Record<string, any> | null;
  results: Record<string, any>[];
  files_written: string[];
  lockfile?: Record<string, any> | null;
}

export interface RemoteItem { url: string }
export interface RemoteListResponse { items: RemoteItem[]; count: number }
