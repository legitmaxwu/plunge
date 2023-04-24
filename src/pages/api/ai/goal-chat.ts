import { getAuth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { type Message, streamChatCompletion } from "../../../server/openai";

export const config = {
  runtime: "edge",
};

// const SYSTEM_PROMPT = `
// As a chatbot, answer questions and provide guidance based on a written guide. Address concerns or questions briefly (50-100 words), and suggest 1-2 goals if needed. Use separate Markdown paragraphs for goals, formatted as "@@@@{title_of_goal, under 15 words}@@@@". Goals should be standalone sentences (without a period at the end), context-free, specific, measurable, and clear. Use basic Markdown formatting.

// Example:

// This is a paragraph.

// @@@@Goal example@@@@

// @@@@Another goal example@@@@

// This is another paragraph.

// Separate each goal with TWO newlines. Ensure proper formatting.
// `.trim();

const SYSTEM_PROMPT = `
As a chatbot, answer questions and provide guidance based on a written guide. Address concerns or questions briefly (50-100 words), and suggest 1-2 goals if needed. Use separate Markdown paragraphs for goals, formatted as "@@@@{title_of_goal, under 15 words}@@@@". Goals should be standalone sentences, context-free, specific, measurable, and clear. Use basic Markdown formatting. If helpful, create patchfiles for modifying guide sections.

Example:

This is a paragraph.

@@@@Goal example@@@@

@@@@Another goal example@@@@

This is another paragraph.

Separate each goal with TWO newlines. Ensure proper formatting communication.

For patchfile creation, use this format:

\`\`\`patchfile
--- article/a
+++ article/b
@@ -1,3 +1,3 @@
-This is a paragraph.
+This is a paragraph. It has been modified.
 This is another paragraph, which has not been modified.
\`\`\`

The guide article is provided in the second User message. Each line of the article is formatted as {line_number}|{content}. Only {content} should be considered as part of the article. Patchfiles should act on the "article" string contents. If you include a patchfile, do not also include what the guide looks like after the patchfile is applied. Make sure the patchfile works!!!
`.trim();

const handler = async (req: NextRequest): Promise<Response> => {
  const auth = getAuth(req);
  if (!auth.userId) throw new Error("Not logged in");

  const { goal, article, query } = z
    .object({
      goal: z.string(),
      article: z.string(),
      query: z.string(),
    })
    .parse(await req.json());

  const stream = await streamChatCompletion(
    [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Goal:\n\n${goal}`,
      },
      {
        role: "user",
        content: `${article
          .split("\n")
          .map((line, idx) => `${idx + 1}|${line}`)
          .join("\n")}`,
      },
      {
        role: "user",
        content: query,
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
