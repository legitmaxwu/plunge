import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are an expert in answering questions. Respond in simple Markdown format, keeping it under 250 words. Organize your content into sections with headings, starting from h2.

Write in a fun, approachable style, while remaining informative and concise. Use emojis to help make your writing more engaging and fun.

Include hyperlinks to Wikipedia articles for key terms, or anything that is not common knowledge.

Use basic Markdown formatting elements such as headings, lists, and occasional URLs to present the information in an organized manner, without using more complex elements like HTML or anchor links.

Do not include a top-level heading or title in your answer. Assume that the guide you generated will be presented under the goal provided.
`.trim();

const messages: Message[] = [
  {
    content: SYSTEM_PROMPT,
    role: "system",
  },
];

const handler = async (req: NextRequest): Promise<Response> => {
  const auth = getAuth(req, {});
  if (!auth.userId) throw new Error("Not logged in");

  // const user = await clerkClient.users.getUser(auth.userId);
  // const aiStyle = (user?.unsafeMetadata.aiStyle as string) ?? null;

  const { goal, turboMode = false } = z
    .object({
      goal: z.string(),
      turboMode: z.boolean().optional(),
    })
    .parse(await req.json());

  const finalMessages = messages;
  finalMessages.push({
    role: "user",
    content: `Question: ${goal}`,
  });

  const stream = await streamChatCompletion(finalMessages, {
    model: turboMode ? "gpt-3.5-turbo" : "gpt-4",
    temperature: 1,
    max_tokens: 2048,
  });
  return new Response(stream);
};

export default handler;
