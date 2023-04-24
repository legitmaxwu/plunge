import axios from "axios";
import { z } from "zod";
import { parse } from "node-html-parser";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const publicRouter = createTRPCRouter({
  fetchMarkdown: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(async ({ input }) => {
      const { url } = input;

      // Load the link into a document object using JSDOM
      return JSDOM.fromURL(url)
        .then((dom) => {
          // Use Readability to extract the article text
          const reader = new Readability(dom.window.document);
          const article = reader.parse();

          // Convert the article HTML to markdown
          const turndownService = new TurndownService();
          const markdown = turndownService.turndown(article?.content ?? "");

          // Return the markdown
          return markdown;
        })
        .catch((error) => {
          console.error(`Error loading or parsing ${url}`);
          return null;
        });
    }),
  fetchFaviconAndTitle: publicProcedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { url } = input;
      try {
        const response = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
          },
          timeout: 5000,
        });

        const root = parse(response.data as string);
        const faviconLink =
          root.querySelector("link[rel*='icon']") ||
          root.querySelector("link[rel*='shortcut icon']");

        const faviconUrl = faviconLink
          ? new URL(
              faviconLink.getAttribute("href")?.toString() ?? "",
              url
            ).toString()
          : `${url}/favicon.ico`;

        const titleElement = root.querySelector("title");
        const title = titleElement ? titleElement.text : "Untitled";

        return { faviconUrl, title };
      } catch (error) {
        console.error("Error fetching favicon and title:", error);
        return { faviconUrl: "", title: "Error fetching data" };
      }
    }),
});
