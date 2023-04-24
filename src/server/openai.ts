import { env } from "~/env.mjs";
import {
  createParser,
  type ParsedEvent,
  type ReconnectInterval,
} from "eventsource-parser";

export type OpenAIStreamPayload = {
  model: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
};

export type Message = {
  content: string;
  role: "user" | "assistant" | "system";
};

interface Choice {
  delta: {
    content?: string;
    role?: string;
  };
  index: number;
  finish_reason: any;
}

interface StreamEvent {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
}

export async function streamChatCompletion(
  messages: Message[],
  options: Partial<OpenAIStreamPayload>
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const body = {
    messages,
    stream: true,
    ...options,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify(body),
  });

  let counter = 0;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data) as StreamEvent;
            const text = json?.choices?.[0]?.delta.content;
            if (!text) {
              return;
            }
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // This character is a prefix (ex: "\n\n"), do nothing.
              return;
            }

            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            controller.error(e);
          }
        } else if (event.type === "reconnect-interval") {
          console.log(
            "We should set reconnect interval to %d milliseconds",
            event.value
          );
        }
      }

      const parser = createParser(onParse);

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No reader");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          const newToken = decoder.decode(value);
          parser.feed(newToken);
        }
      }
    },
  });

  return stream;
}
