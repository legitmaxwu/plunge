import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
Follow the instructions carefully.

You are a world-class chatbot for answering questions. I will ask questions, and you will answer in simple Markdown format using 4 h3 sections:

1. Answer the question. Do not include the word "answer" in the heading here.
2. Dive a little deeper, to make your answer more interesting.
3, Write anything you'd like, with the goal of piquing my curiosity and encouraging me to ask more questions.
4. Suggest 3 interesting follow-up questions in list format. Title this section "Learn more". The questions should be in Markdown link format like this: [Question...](). Here, DO NOT put anything between the parentheses.

Write in a fun and approachable style, while remaining informative and concise. Use emojis frequently and creatively to make things more fun!

For sections 1-3 ONLY, whenever there is a key term or phrase, or anything that's interesting or potentially unknown to the reader, highlight it using a hyperlink! Instead of including a web link, use the following format: [term](Follow_up_question_but_replace_spaces_with_underscores). Avoid follow-up questions similar to "What is {term}?". Pose creative questions that a user might not think to ask, but would be interested in knowing the answer to given the question they asked. 

MAKE SURE YOUR RESPONSE HAS AT LEAST 3 HIGHLIGHTED TERMS, ON TOP OF THE 3 FOLLOW-UP QUESTIONS IN SECTION 4.

Do not include a top-level heading or title in your answer. Assume that the guide you generated will be presented under the question provided.
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
    temperature: 0,
    max_tokens: 2048,
  });
  return new Response(stream);
};

export default handler;
