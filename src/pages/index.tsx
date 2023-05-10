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

function HomePage() {
  const router = useRouter();

  const { data: plunges, isLoading } = api.plunge.getAll.useQuery();

  const init = useStackStore((state) => state.init);

  const nothingCreated = plunges?.length === 0;

  return (
    <div className="flex h-screen flex-col items-center bg-gradient-to-r from-sky-200 to-blue-200">
      <Navbar />
      <div className="h-16"></div>
      <div className="max-w-2xl px-8">
        <div className="text-2xl font-bold">{"Plunges"}</div>
        <div className="h-8"></div>
        <div className="flex flex-wrap items-center gap-2">
          {isLoading && (
            <div className="w-48 animate-pulse bg-black/5 px-3 py-2 shadow-md">
              &nbsp;
            </div>
          )}

          {plunges?.map((plunge) => (
            <button
              className="bg-white/20 px-3 py-2 shadow-md hover:bg-white/40"
              key={plunge.id}
              onClick={() => {
                init(plunge.id);

                router
                  .push(`/plunge/${plunge.id}/question/${plunge.questionId}`)
                  .catch(handleError);
              }}
            >
              {plunge.question.title}
            </button>
          ))}
          {plunges?.length === 0 && (
            <div className="text-gray-500">
              You haven&apos;t embarked on any plunges yet.
            </div>
          )}
        </div>
        <div className="h-8"></div>
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
