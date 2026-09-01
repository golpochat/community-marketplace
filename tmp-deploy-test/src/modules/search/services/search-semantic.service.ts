import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchSemanticService {
  async generateEmbedding(text: string): Promise<number[] | undefined> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return undefined;

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
          input: text.slice(0, 8000),
        }),
      });
      if (!response.ok) return undefined;
      const json = (await response.json()) as {
        data?: Array<{ embedding: number[] }>;
      };
      return json.data?.[0]?.embedding;
    } catch {
      return undefined;
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const av = a[i] ?? 0;
      const bv = b[i] ?? 0;
      dot += av * bv;
      normA += av ** 2;
      normB += bv ** 2;
    }
    if (!normA || !normB) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async hybridRank<T extends { embedding?: number[] }>(
    query: string,
    hits: T[],
    keywordScores: number[],
  ): Promise<Array<T & { score: number }>> {
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) {
      return hits.map((hit, i) => ({ ...hit, score: keywordScores[i] ?? 1 }));
    }

    return hits
      .map((hit, i) => {
        const keywordScore = keywordScores[i] ?? 1;
        const semanticScore = hit.embedding
          ? this.cosineSimilarity(queryEmbedding, hit.embedding)
          : 0;
        return { ...hit, score: keywordScore * 0.6 + semanticScore * 0.4 };
      })
      .sort((a, b) => b.score - a.score);
  }
}
