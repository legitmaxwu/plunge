import { useRouter } from "next/router";
import { useState } from "react";
import { ChevronDownIcon, HomeIcon } from "@heroicons/react/24/outline";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./base/Select";
import { Button } from "./base/Button";

export function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [open, setOpen] = useState(false);
  return (
    <div className="flex justify-between p-8 pb-0">
      <button
        className="mr-2 flex items-center gap-1.5 font-medium"
        onClick={() => {
          router.push("/").catch(handleError);
        }}
      >
        <HomeIcon className="s-5 w-5" />
        Home
      </button>
      <div className="flex items-center">
        <div className="flex items-center gap-4">
          <div>
            {user?.firstName} {user?.lastName}
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
  );
}
