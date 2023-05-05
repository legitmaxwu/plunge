import { useRouter } from "next/router";
import { useState } from "react";
import {
  ChevronDownIcon,
  HomeIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  UserIcon,
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
import { Switch } from "./base/Switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./base/Tooltip";
import { useAtom } from "jotai";
import { turboModeAtom } from "../utils/jotai";
import { Save } from "./Save";

export function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const onGoalPage = router.pathname.includes("/goal");
  const notAtRoot = router.pathname !== "/";

  const [turboMode, setTurboMode] = useAtom(turboModeAtom);

  return (
    <div className="w-full">
      <div className="flex justify-between bg-blue-600/5 px-4 py-2 md:px-8">
        <div className="flex items-center gap-2 md:gap-8">
          <div className="flex select-none items-center gap-1.5">
            <div className="text-2xl">🤿</div>
            <div className="mb-0.5 text-lg font-bold text-blue-950">Plunge</div>
          </div>
          <div className="flex select-none items-center gap-2 md:gap-6">
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
                        <h2 className="mb-1 font-medium underline">Explore</h2>
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
                        <h2 className="mb-1 font-medium underline">Inquire</h2>
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
          <Save />
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
      <div className="h-px bg-gradient-to-r from-sky-300 to-blue-300"></div>
    </div>
  );
}
