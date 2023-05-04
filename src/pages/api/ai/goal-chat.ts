import { clerkClient, getAuth } from "@clerk/nextjs/server";
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
As a chatbot, respond to messages based on a question and article.

1. First, address the message briefly (<50 words). 
2. Then, only if appropriate, suggest 2-3 follow-up questions for the user to wonder about. 
3. If the users asks to modify the article, create a patchfile.

Write in a fun, approachable style, while remaining informative and concise. Use emojis to help make your writing more engaging.

## Follow-up questions

The questions should be under 15 words and end with a question mark. They should be interesting and thought-provoking. The questions should be from the perspective of the user, not the chatbot.

Each follow-up question is in its own Markdown list element, beginning and ending with "҂". 

Formatting Example (Do not pay attention to the content of the questions. Follow the format closely!):

- ҂How does ... work?҂
- ҂What are the different types of ...?҂

## Patchfiles

For patchfiles, first state the contents of the exact line you are trying to modify. Then, output the patchfile in Unified Diff Format:

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

The article is provided in the second User message. Each line is formatted as {line_number}҂{content}. Only {content} should be considered part of the original string. Begin your patchfile at the nearest heading. Double-check the patchfile for errors before submitting. MAINTAIN THE ORIGINAL FORMATTING of the article in your patchfile!!!
`.trim();

const handler = async (req: NextRequest): Promise<Response> => {
  const auth = getAuth(req);
  if (!auth.userId) throw new Error("Not logged in");
  // const user = await clerkClient.users.getUser(auth.userId);
  // const aiStyle = (user?.unsafeMetadata.aiStyle as string) ?? null;

  const {
    goal,
    article,
    query,
    turboMode = false,
  } = z
    .object({
      goal: z.string(),
      article: z.string(),
      query: z.string(),
      turboMode: z.boolean().optional(),
    })
    .parse(await req.json());

  const finalMessages: Message[] = [];
  finalMessages.push({
    role: "system",
    content: SYSTEM_PROMPT,
  });
  finalMessages.push({
    role: "user",
    content: `Question:\n\n${goal}`,
  });
  finalMessages.push({
    role: "user",
    content: `Article:\n\n${article
      .split("\n")
      .map((line, idx) => `${idx + 1}҂${line}`)
      .join("\n")}`,
  });
  // if (aiStyle) {
  //   finalMessages.push({
  //     role: "user",
  //     content: `Write in the following style:\n\n${aiStyle}`,
  //   });
  // }

  finalMessages.push({
    role: "user",
    content: `Message:\n\n${query}`,
  });

  const stream = await streamChatCompletion(finalMessages, {
    model: turboMode ? "gpt-3.5-turbo" : "gpt-4",
    temperature: 0,
    max_tokens: 2048,
  });
  return new Response(stream);
};

export default handler;
