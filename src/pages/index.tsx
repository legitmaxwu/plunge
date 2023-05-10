import { useUser, useClerk } from "@clerk/nextjs";
import { type NextPage } from "next";
import { useRouter } from "next/router";
import { Button } from "../components/base/Button";

import LandingPage from "../components/LandingPage";
import { Navbar } from "../components/Navbar";
import { api } from "../utils/api";
import { handleError } from "../utils/handleError";
import { useStackStore } from "../utils/zustand/stackStore";
import { Sparkles } from "../components/Sparkles";
import Link from "next/link";
import {
  ArrowRightIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PencilSquareIcon as SolidPencilSquareIcon } from "@heroicons/react/24/solid";

import { useState } from "react";
import clsx from "clsx";
import { IconButton } from "../components/IconButton";
import toast from "react-hot-toast";
import { Fade } from "../components/animate/Fade";

function HomePage() {
  const router = useRouter();
  const utils = api.useContext();
  const { data: plunges, isLoading } = api.plunge.getAll.useQuery();

  const { mutateAsync: deletePlunge } = api.plunge.delete.useMutation({
    onSuccess() {
      utils.plunge.getAll.invalidate().catch(handleError);
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  const nothingCreated = plunges?.length === 0;

  return (
    <div className="flex h-screen flex-col items-center bg-gradient-to-r from-sky-200 to-blue-200">
      <Navbar />
      <div className="h-16"></div>
      <div className="w-full max-w-xl px-4 sm:px-8">
        <div className="flex items-center">
          <div className="text-2xl font-bold">{"Plunges"}</div>

          <IconButton
            icon={isEditing ? SolidPencilSquareIcon : PencilSquareIcon}
            className={clsx({
              "ml-1": true,
              "text-gray-500": !isEditing,
            })}
            tooltipText={isEditing ? "Done Editing" : "Edit Answer"}
            onClick={() => {
              setIsEditing((prev) => !prev);
            }}
          />
        </div>
        <div className="h-12"></div>
        <div className="flex flex-col items-start gap-4">
          {isLoading && (
            <div className="w-48 animate-pulse bg-black/5 px-3 py-2 shadow-md">
              &nbsp;
            </div>
          )}

          {plunges?.map((plunge) => (
            <Link
              key={plunge.id}
              className={clsx({
                "flex items-start text-xl font-semibold text-cyan-700 ": true,
                "pointer-events-none": isEditing,
                "hover:text-cyan-500": !isEditing,
              })}
              href={`/plunge/${plunge.id}/question/${plunge.questionId}`}
            >
              {isEditing ? (
                <Fade>
                  <button
                    className="pointer-events-auto h-7 w-7 shrink-0 items-start text-gray-500 transition hover:text-black"
                    onClick={(e) => {
                      e.preventDefault();
                      const confirm = window.confirm(
                        "Are you sure you want to delete this plunge? All questions associated with it will be deleted as well."
                      );
                      if (!confirm) return;

                      toast
                        .promise(
                          deletePlunge({
                            id: plunge.id,
                          }),
                          {
                            loading: "Deleting...",
                            success: "Deleted!",
                            error: "Failed to delete.",
                          }
                        )
                        .catch(handleError);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </Fade>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-start">
                  <ArrowRightIcon
                    strokeWidth={2}
                    className="mr-1.5 mt-[0.45rem] inline h-4 w-4 shrink-0"
                  />
                </div>
              )}

              {plunge.question.title || "Untitled Question"}
            </Link>
          ))}
          {plunges?.length === 0 && (
            <div className="text-gray-500">
              You haven&apos;t embarked on any plunges yet.
            </div>
          )}
        </div>
        <div className="h-12"></div>
        <Sparkles enabled={nothingCreated} frequency={6}>
          <Button
            onClick={() => {
              router.push("/create/custom").catch(handleError);
            }}
            className="shadow-md"
          >
            Begin a new plunge 💦
          </Button>
        </Sparkles>
      </div>
    </div>
  );
}
const Home: NextPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <>
      <main>{isSignedIn ? <HomePage /> : <LandingPage />}</main>
    </>
  );
};

export default Home;
