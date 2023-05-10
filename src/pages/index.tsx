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
import { ArrowRightIcon } from "@heroicons/react/24/outline";

function HomePage() {
  const router = useRouter();

  const { data: plunges, isLoading } = api.plunge.getAll.useQuery();

  const init = useStackStore((state) => state.init);

  const nothingCreated = plunges?.length === 0;

  return (
    <div className="flex h-screen flex-col items-center bg-gradient-to-r from-sky-200 to-blue-200">
      <Navbar />
      <div className="h-16"></div>
      <div className="w-full max-w-xl px-4 sm:px-8">
        <div className="text-2xl font-bold">{"Plunges"}</div>
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
              className="flex items-start text-xl font-semibold text-cyan-700 hover:text-cyan-500"
              href={`/plunge/${plunge.id}/question/${plunge.questionId}`}
            >
              <ArrowRightIcon
                strokeWidth={2}
                className="mr-1.5 mt-[0.45rem] inline h-4 w-4 shrink-0"
              />
              {plunge.question.title}
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
