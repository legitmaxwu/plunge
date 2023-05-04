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

export function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const showHelp = router.pathname.includes("/goal");

  return (
    <div className="w-full">
      <div className="flex justify-between px-4 py-2 md:px-8">
        <div className="flex items-center gap-2 md:gap-8">
          <div className="flex select-none items-center gap-1.5">
            <div className="text-2xl">🤿</div>
            <div className="mb-0.5 text-lg font-bold text-blue-950">Plunge</div>
          </div>
          <div className="flex select-none items-center gap-2 md:gap-6">
            <button
              className="flex items-center gap-1 hover:text-gray-600"
              onClick={() => {
                router.push("/").catch(handleError);
              }}
            >
              <HomeIcon strokeWidth={2} className="h-5 w-5" />
              Home
            </button>
            <button
              className="flex items-center gap-1 hover:text-gray-600"
              onClick={() => {
                router.push("/personalize").catch(handleError);
              }}
            >
              <UserIcon strokeWidth={2} className="h-5 w-5" />
              Personalize
            </button>
            {showHelp && (
              <Dialog>
                <DialogTrigger>
                  <button className="flex items-center gap-1 font-semibold text-cyan-600 hover:text-cyan-500">
                    <InformationCircleIcon
                      strokeWidth={2}
                      className="s-5 w-5"
                    />
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
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center gap-4">
            <div className="whitespace-nowrap font-semibold">
              {user?.fullName}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex cursor-pointer items-center gap-1">
                  <Avatar>
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback>
                      {user?.firstName?.[0]?.toUpperCase()}
                      {user?.lastName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDownIcon className="h-3 w-3" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuItem
                  className="text-red-900/90"
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
