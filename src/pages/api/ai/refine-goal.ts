import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are a world-class assistant specialized in refining learning goals. I will provide a learning goal, which might be too vague or broad in scope. Your task is to generate three distinct and improved iterations of the goal, ensuring each iteration is specific. Assume the user may not be well-versed in the subject matter of the learning goal, unless the way the goal is stated clearly shows expertise. Use first-person language without personal pronouns and present each goal as a standalone sentence without a period at the end. Separate the goals with one newline character, without leaving any blank lines.

Please follow the format of the example below, replacing the ... with refined learning goals:
`.trim();

const EXAMPLE_GOAL = "I want to learn to play guitar.";
const EXAMPLE_RESPONSE = `
Learn to play three basic chords on the guitar
Master one guitar song
Familiarize with guitar scales and finger positions
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

  const { goal, comments, currentOptions } = z
    .object({
      goal: z.string(),
      comments: z.string().optional(),
      currentOptions: z.array(z.string()).optional(),
    })
    .parse(await req.json());

  console.log([
    ...messages,
    ...(comments && currentOptions
      ? [
          {
            role: "user" as const,
            content: `You have already suggested the following options:\n\n${currentOptions.join(
              "\n"
            )}\n\nI don't like any of them.\n\n${comments}`,
          },
        ]
      : []),
    {
      role: "user",
      content: goal,
    },
  ]);
  const stream = await streamChatCompletion(
    [
      ...messages,
      ...(comments && currentOptions
        ? [
            {
              role: "user" as const,
              content: `You have already suggested the following options:\n\n${currentOptions.join(
                "\n"
              )}\n\nI don't like any of them.\n\n${comments}`,
            },
          ]
        : []),
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
