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
As a chatbot, answer questions and provide guidance based on a written guide. Address concerns or questions briefly (<50 words), and suggest 2-5 learning goals if needed. Use separate Markdown paragraphs for goals, formatted as "@@@@{title_of_goal, in plain text, under 20 words}@@@@". Goals should be standalone sentences, context-free, specific, measurable, and clear. They should help the user gather knowledge or experience to better prepare them for tackling their learning goal. Use basic Markdown formatting. If helpful, create patchfiles for modifying guide sections.

Example:

This is a paragraph.

@@@@Goal example (must be in plain text)@@@@

@@@@Another goal example@@@@

This is another paragraph.

Separate each goal with TWO newlines!!! Ensure proper formatting.

For patchfile creation, first state the contents of the exact line you are trying to modify. Then, output the patchfile in Unified Diff Format:

\`\`\`patchfile
--- original.txt
+++ modified.txt
@@ -7,1 +7,4 @@
-{content}
+Added line
+Added another line
+Added yet another line
+Added a fourth line
\`\`\`

The guide article is provided in the second User message, formatted as {line_number}҂{content}. Only {content} should be considered part of the original string. Begin your patchfile at the nearest heading. Double-check the patchfile for errors before submitting. MAINTAIN THE ORIGINAL FORMATTING of the guide article in your patchfile!!!
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
        content: `Guide article:\n\n${article
          .split("\n")
          .map((line, idx) => `${idx + 1}҂${line}`)
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
