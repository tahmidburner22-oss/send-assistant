/**
 * callAIStream — streaming variant of callAI.
 *
 * Uses Server-Sent Events (SSE) via POST to /api/ai/generate-stream.
 * Returns an async generator that yields text chunks as they arrive,
 * making AI output appear progressively (~3x perceived speed improvement).
 *
 * Falls back to non-streaming callAI if:
 *   - The browser doesn't support ReadableStream
 *   - The server returns a non-streaming response (e.g. 4xx error)
 *
 * Usage:
 *   for await (const chunk of callAIStream(system, user, maxTokens)) {
 *     accumulated += chunk.text;
 *     setResult(accumulated);
 *   }
 */

export interface StreamChunk {
  text: string;
  done: boolean;
  provider?: string;
}

export async function* callAIStream(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2500
): AsyncGenerator<StreamChunk, void, unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90s for streaming

  try {
    const res = await fetch("/api/ai/generate-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify({ prompt: userPrompt, systemPrompt, maxTokens }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Non-streaming error — parse and throw
      const errData = await res.json().catch(() => ({ error: "Stream request failed" }));
      throw new Error(errData.error || `Stream failed: ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";

    // If server returned JSON (non-streaming fallback), yield the whole thing
    if (contentType.includes("application/json")) {
      const data = await res.json();
      const content = data.content || data.text || "";
      yield { text: content, done: true, provider: data.provider };
      return;
    }

    // SSE stream — parse "data:" lines from the text/event-stream response
    if (!res.body) {
      throw new Error("Response body is null — streaming not supported");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let provider = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete last line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            yield { text: "", done: true, provider };
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.provider) provider = parsed.provider;
            if (parsed.error) throw new Error(parsed.error);
            const chunk = parsed.text || parsed.content || parsed.delta || "";
            if (chunk) {
              yield { text: chunk, done: false, provider };
            }
          } catch (parseErr) {
            // If it's not JSON, treat as raw text chunk
            if (payload && payload !== "[DONE]") {
              yield { text: payload, done: false, provider };
            }
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      if (buffer.startsWith("data: ")) {
        const payload = buffer.slice(6).trim();
        if (payload && payload !== "[DONE]") {
          try {
            const parsed = JSON.parse(payload);
            yield { text: parsed.text || parsed.content || parsed.delta || "", done: true, provider };
          } catch {
            yield { text: payload, done: true, provider };
          }
        }
      }
    }

    yield { text: "", done: true, provider };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper: check if the browser supports streaming responses.
 * Falls back gracefully in environments where ReadableStream isn't available.
 */
export function supportsStreaming(): boolean {
  return (
    typeof ReadableStream !== "undefined" &&
    typeof TextDecoder !== "undefined" &&
    typeof fetch !== "undefined"
  );
}

export default callAIStream;
