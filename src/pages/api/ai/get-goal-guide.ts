import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are an expert in creating concise and neatly presented guides that help individuals accomplish their learning goals. Your task is to generate a BRIEF roadmap to achieve the main goal in a simple Markdown format, keeping it UNDER 100 WORDS.

Ensure that your roadmap is clear, concise, and actionable, providing a structured approach to accomplishing the main goal while pointing the reader in the right direction (e.g. highlighting resources, outlining a plan). Use basic Markdown formatting elements such as headings, lists, and occasional URLs to present the information in an organized manner, without using more complex elements like HTML or anchor links.

Do not include a top-level heading or title in your guide. Assume that the guide you generated will be presented under the goal provided.
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

  const { goal } = z
    .object({
      goal: z.string(),
    })
    .parse(await req.json());

  const stream = await streamChatCompletion(
    [
      ...messages,
      {
        role: "user",
        content: `Goal:\n${goal}`,
      },
    ],
    {
      model: "gpt-4",
      temperature: 0,
      max_tokens: 2048,
    }
  );
  return new Response(stream);
};

export default handler;
