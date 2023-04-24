import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are an expert in breaking down complex goals into manageable, understandable steps, and excel at communicating ideas clearly to people with varying levels of expertise.

When I provide a goal, your task is to generate a concise list of 3-6 unnumbered prerequisite goals that prepare and empower me to confidently pursue my main objective. Please format each prerequisite goal as a standalone sentence without a period at the end, using first-person language without personal pronouns. Each goal should be context-free, specific, and have a clear notion of "success." Present the goals in a single list with one newline character between each goal, without leaving any blank lines.

Remember that these prerequisite goals should not be direct steps toward the main goal or form a step-by-step guide. Instead, they should act as crucial milestones that enable me to comfortably and effectively work towards my desired outcome.
`.trim();

const EXAMPLE_GOAL = "I want to ...";
const EXAMPLE_RESPONSE = `
Learn ...
Do ...
`.trim();

const messages: Message[] = [
  {
    content: SYSTEM_PROMPT,
    role: "system",
  },
  {
    content: EXAMPLE_GOAL,
    role: "user",
  },
  {
    content: EXAMPLE_RESPONSE,
    role: "assistant",
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
        content: goal,
      },
    ],
    {
      model: "gpt-4",
      temperature: 0,
      max_tokens: 1000,
    }
  );
  return new Response(stream);
};

export default handler;
