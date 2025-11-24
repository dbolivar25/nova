/**
 * Nova Streaming Protocol
 *
 * NDJSON-based streaming protocol for Nova chat responses.
 * Each line is a JSON object with a `type` field.
 */

// Event types sent from server to client
export type NovaStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; content: string; sources: NovaSource[] }
  | { type: "error"; message: string };

export type NovaSource =
  | {
      type: "JournalEntryRef";
      entryDate: string;
      excerpt: string;
      mood?: string;
    }
  | {
      type: "WeeklyInsightRef";
      weekStartDate: string;
      insightType: string;
      summary: string;
    };

export interface NovaStreamResult {
  content: string;
  sources: NovaSource[];
}

/**
 * Parse an NDJSON stream of Nova events.
 * Yields delta text as it arrives, returns final result.
 */
export async function parseNovaStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onDelta: (text: string) => void
): Promise<NovaStreamResult> {
  const decoder = new TextDecoder();
  let buffer = "";
  let streamedContent = "";
  let finalContent = "";
  let sources: NovaSource[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line) as NovaStreamEvent;

        switch (event.type) {
          case "delta":
            streamedContent += event.text;
            onDelta(streamedContent);
            break;
          case "done":
            finalContent = event.content;
            sources = event.sources ?? [];
            break;
          case "error":
            throw new Error(event.message);
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.warn("[Nova Stream] Malformed line:", line);
        } else {
          throw e;
        }
      }
    }
  }

  return {
    content: finalContent || streamedContent.trim(),
    sources,
  };
}

/**
 * Create an NDJSON event string for streaming.
 */
export function encodeNovaEvent(event: NovaStreamEvent): string {
  return JSON.stringify(event) + "\n";
}
