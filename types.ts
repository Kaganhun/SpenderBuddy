

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface Preferences {
  historyCount: number;
}

export interface ImageQuery {
    mimeType: string;
    data: string; // base64 encoded
}

// FIX: Add FilterCategory interface, which was missing and causing an import error.
export interface FilterCategory {
  category: string;
  options: string[];
}

export interface SavedItem {
    response: string;
    sources: GroundingChunk[];
    imageUrl: string | null;
    filters?: FilterCategory[];
    query: string;
    query2?: string;
    savedAt: number;
    note?: string;
}