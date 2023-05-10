// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { Button } from "../components/base/Button";
import { SidePadding } from "../components/layout/SidePadding";
import { Navbar } from "../components/Navbar";
import { useCallback, useEffect, useState } from "react";
import { Textarea } from "../components/base/Textarea";
import { useUser } from "@clerk/nextjs";
import { handleError } from "../utils/handleError";
import { useChatCompletion } from "../hooks/useChatCompletion";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import { useAtom } from "jotai";
import { loadingAiAtom } from "../utils/jotai";

const Learn: NextPage = () => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [aiStyle, setAiStyle] = useState("");
  const { user } = useUser();

  useEffect(() => {
    if (user?.unsafeMetadata.aiStyle) {
      setAiStyle(user.unsafeMetadata.aiStyle as string);
    }
  }, [user]);

  const [sample, setSample] = useState("");

  const handleNewToken = useCallback((token: string) => {
    setSample((prev) => prev + token);
  }, []);
  const [loadingAi, setLoadingAi] = useAtom(loadingAiAtom);
  const { initiateChatCompletion } = useChatCompletion({
    apiEndpoint: "/api/ai/get-style-sample",
    handleNewToken,
  });

  const handleSampleClick = useCallback(() => {
    setSample("");
    initiateChatCompletion({
      aiStyle,
    });
  }, [aiStyle, initiateChatCompletion]);

  const save = useCallback(() => {
    if (!user) {
      return;
    }
    toast
      .promise(
        user.update({
          unsafeMetadata: {
            aiStyle,
          },
        }),
        {
          loading: "Saving...",
          success: "Saved!",
          error: "Failed to save.",
        }
      )
      .catch(handleError);
  }, [aiStyle, user]);

  return (
    <div className="flex h-[calc(100dvh)] flex-col items-center bg-gradient-to-r from-sky-200 to-blue-200">
      <Navbar />
      <SidePadding className="justify-between">
        <div className="h-16"></div>

        <div className="">
          <div className="text-2xl font-bold">{"Personalize"}</div>
          <div className="h-8"></div>
          <div className="font-bold text-gray-600">
            How would you like the AI to speak?
          </div>
          <div className="h-2"></div>

          <Textarea
            placeholder="Type here..."
            className="w-full max-w-lg"
            value={aiStyle}
            onValueChange={setAiStyle}
          ></Textarea>
          <div className="flex items-center gap-1">
            <Button
              size="small"
              onClick={() => {
                setAiStyle("Be passionate in your writing.");
              }}
            >
              Be passionate
            </Button>
            <Button
              size="small"
              onClick={() => {
                setAiStyle("Be concise in your writing.");
              }}
            >
              Be concise
            </Button>
            <Button
              size="small"
              onClick={() => {
                setAiStyle(
                  "Use emojis to create a similar reading experience to the Geronimo Stilton books."
                );
              }}
            >
              Add emojis
            </Button>
            <Button
              size="small"
              onClick={() => {
                setAiStyle("Use puns in your writing.");
              }}
            >
              Use puns
            </Button>
          </div>

          <div className="h-8"></div>
          <Button
            onClick={handleSampleClick}
            disabled={!aiStyle}
            loading={loadingAi}
          >
            Generate Sample
          </Button>
          <div className="h-2"></div>
          <div
            className={clsx({
              "max-w-lg rounded-md bg-white/20 px-4 py-2": true,
              "text-gray-500": !sample,
            })}
          >
            {sample || "Sample will appear here..."}
          </div>
          <div className="h-12"></div>
          <Button onClick={save}>Save</Button>
        </div>
      </SidePadding>
    </div>
  );
};

export default Learn;
