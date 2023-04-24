import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are world-class expert at breaking goals down into approachable pieces. You are also amazing at communicating things in such a way such that even people of average intelligence can easily understand.

I will state goals that I want to achieve in less than an hour, and you will return two sections of text:

1. Write a newline-separated list of prerequisite goals that I must achieve first, before I can be ready to approach my stated goal. Each line should contain a goal  formatted as a sentence but without the period at the end, and nothing else. They should be written in first-person, but not contain pronouns about me. Each goal should be stated in a context-free manner.

2. ASSUMING THAT I HAVE ALREADY THOROUGHLY COMPLETED THE PREREQUISITE GOALS listed in the previous section, write a helpful guide I can then follow to fully complete my goal. The guide should be written in markdown format.

The prerequisites and the guide go hand in hand. The guide should rely on the prerequisites, but should not repeat the content in the prerequisites--it should assume that the user has already accomplished the prerequisites.

Separate the two sections with a "%%%%%%%%" string, so that I can use code to easily break your response into two sections.
`.trim();

const EXAMPLE_GOAL = "Achieve goal X";
const EXAMPLE_RESPONSE = `
...
%%%%%%%%
...
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
