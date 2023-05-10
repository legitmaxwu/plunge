import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { handleError } from "../utils/handleError";
import { Avatar, AvatarFallback, AvatarImage } from "./base/Avatar";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./base/Dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./base/Dialog";
import { useAtom } from "jotai";
import { turboModeAtom } from "../utils/jotai";
import ReactTextareaAutosize from "react-textarea-autosize";
import clsx from "clsx";
import { useHotkeys } from "@mantine/hooks";

function PlungeModal() {
  const [newQuestion, setNewQuestion] = useState("");
  const [open, setOpen] = useState(false);

  const openPlungeModal = useCallback((newQuestion: string) => {
    setOpen(true);
    setNewQuestion(newQuestion);
  }, []);

  const handlePlunge = useCallback(
    (e: any) => {
      const ev = e as CustomEvent<{ newQuestion: string }>;
      openPlungeModal(ev.detail.newQuestion);
    },
    [openPlungeModal]
  );

  useEffect(() => {
    window.addEventListener("plunge", handlePlunge);
    return () => {
      window.removeEventListener("plunge", handlePlunge);
    };
  }, [handlePlunge]);

  useHotkeys([
    [
      "mod+K",
      () => {
        openPlungeModal("");
      },
    ],
    [
      "ctrl+K",
      () => {
        openPlungeModal("");
      },
    ],
  ]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newValue) => {
        setOpen(newValue);
        if (newValue === false) {
          setNewQuestion("");
        }
      }}
    >
      <DialogTrigger>
        <button className="rounded-md bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1 font-medium text-blue-50 transition hover:opacity-80">
          All Questions <span className="ml-0.5 text-sm text-blue-300">⌘K</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Plunge</DialogTitle>
          <DialogDescription>
            <ReactTextareaAutosize
              value={newQuestion}
              placeholder="Type question here..."
              className={clsx({
                "w-full resize-none rounded-sm border border-transparent bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 bg-clip-text px-1 text-lg font-semibold text-transparent caret-black outline-none transition hover:border-sky-300 focus:border-sky-400":
                  true,
                "focus:border-black": true,
              })}
              onChange={(e) => {
                setNewQuestion(e.target.value);
              }}
            />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const onGoalPage = router.pathname.includes("/goal");
  const notAtRoot = router.pathname !== "/";

  const [turboMode, setTurboMode] = useAtom(turboModeAtom);

  return (
    <div className="flex h-14 w-full items-center justify-center bg-blue-600/5">
      <div className="w-full max-w-xl px-4 py-2 sm:px-8">
        <div className="flex justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex select-none items-center gap-1.5">
              <div className="text-2xl">🤿</div>
              <div className="mb-0.5 text-lg font-bold text-blue-950">
                Plunge
              </div>
            </div>
            <div className="flex select-none items-center gap-2 sm:gap-6">
              {notAtRoot && (
                <button
                  className="flex items-center gap-1 hover:text-gray-600"
                  onClick={() => {
                    router.push("/").catch(handleError);
                  }}
                >
                  {/* <HomeIcon strokeWidth={2} className="h-4 w-4" /> */}
                  Home
                </button>
              )}

              {onGoalPage && (
                <>
                  <Dialog>
                    <DialogTrigger>
                      <button className="flex items-center gap-1 font-semibold text-cyan-600 hover:text-cyan-500">
                        {/* <InformationCircleIcon
                      strokeWidth={2}
                      className="h-4 w-4"
                    /> */}
                        Help
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>How to use Plunge</DialogTitle>
                        <DialogDescription>
                          <div className="h-6"></div>
                          <h2 className="mb-1 font-medium underline">
                            Explore
                          </h2>
                          <div className="text-gray-800">
                            Hover over a question to add sub-questions.
                          </div>
                          <div className="h-4"></div>
                          <h2 className="mb-1 font-medium underline">Learn</h2>
                          <div className="text-gray-800">
                            After generating an article, try clicking the{" "}
                            <QuestionMarkCircleIcon className="inline h-4 w-4" />{" "}
                            next to any heading or selecting any text!
                          </div>
                          <div className="h-4"></div>
                          <h2 className="mb-1 font-medium underline">
                            Inquire
                          </h2>
                          <div className="text-gray-800">
                            Ask any questions related to the provided article.
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {/* {onGoalPage && (
              <div className="ml-4 flex items-center">
                <Switch checked={turboMode} onCheckedChange={setTurboMode} />
                <div className="ml-1.5 whitespace-nowrap text-sm">
                  Turbo mode
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <QuestionMarkCircleIcon className="ml-1 h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Enables <b>faster</b> but <b>lower-quality</b> responses.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )} */}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* <PlungeModal /> */}
            {/* <Save /> */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex cursor-pointer select-none items-center gap-2.5">
                  <div className="whitespace-nowrap">{user?.firstName}</div>
                  <div className="flex items-center gap-1">
                    <Avatar className="h-7 w-7 border border-blue-950">
                      <AvatarImage src={user?.profileImageUrl} />
                      <AvatarFallback>
                        {user?.firstName?.[0]?.toUpperCase()}
                        {user?.lastName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDownIcon className="h-3 w-3" />
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuItem
                  className="text-gray-600"
                  onClick={() => {
                    signOut().catch(handleError);
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-sky-300 to-blue-300"></div>
    </div>
  );
}
