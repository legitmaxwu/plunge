import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
Describe the ocean and its inhabitants, in the provided style. Use 2-3 sentences.
`.trim();

const messages: Message[] = [
  {
    content: SYSTEM_PROMPT,
    role: "system",
  },
];

const handler = async (req: NextRequest): Promise<Response> => {
  const auth = getAuth(req);
  if (!auth.userId) throw new Error("Not logged in");

  const { aiStyle } = z
    .object({
      aiStyle: z.string().nonempty(),
    })
    .parse(await req.json());

  const stream = await streamChatCompletion(
    [
      ...messages,
      {
        role: "user" as const,
        content: `Style: ${aiStyle}`,
      },
    ],
    {
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 1000,
    }
  );
  return new Response(stream);
};

export default handler;
