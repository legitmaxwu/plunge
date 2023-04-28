import { useUser, useClerk } from "@clerk/nextjs";
import { useAtom } from "jotai";
import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button } from "../components/base/Button";

import LandingPage from "../components/LandingPage";
import { SidePadding } from "../components/layout/SidePadding";
import { Navbar } from "../components/Navbar";
import { api } from "../utils/api";
import { handleError } from "../utils/handleError";
import { useStackStore } from "../utils/zustand/stackStore";
import { Sparkles } from "../components/Sparkles";

function HomePage() {
  const router = useRouter();

  const { data: journeys, isLoading } = api.journey.getAll.useQuery();

  const init = useStackStore((state) => state.init);

  const nothingCreated = journeys?.length === 0;

  return (
    <div className="flex h-screen flex-col items-center bg-gradient-to-r from-pink-200 to-sky-200">
      <Navbar />
      <SidePadding className="justify-between overflow-y-scroll p-8">
        <div className="h-8"></div>
        <div className="p-8">
          <div className="text-xl font-bold">{"Things I'm learning"}</div>
          <div className="h-8"></div>
          <div className="flex flex-wrap items-center gap-2">
            {isLoading && (
              <div className="w-48 animate-pulse bg-black/5 px-3 py-2 shadow-md">
                &nbsp;
              </div>
            )}

            {journeys?.map((journey) => (
              <button
                className="bg-white/20 px-3 py-2 shadow-md hover:bg-white/40"
                key={journey.id}
                onClick={() => {
                  init(journey.id);

                  router
                    .push(`/journey/${journey.id}/goal/${journey.goalId}`)
                    .catch(handleError);
                }}
              >
                {journey.goal.title}
              </button>
            ))}
            {journeys?.length === 0 && (
              <div className="text-gray-500">
                You haven&apos;t started learning anything yet.
              </div>
            )}
          </div>
          <div className="h-8"></div>
          <Sparkles enabled={nothingCreated} frequency={2} starsPerCycle={3}>
            <Button
              onClick={() => {
                router.push("/create/custom").catch(handleError);
              }}
              className="shadow-md"
            >
              Learn something new
            </Button>
          </Sparkles>
        </div>
      </SidePadding>
    </div>
  );
}
const Home: NextPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <>
      <Head>
        <title>Prereq</title>
        <meta name="description" content="A place for self-study." />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <main>{isSignedIn ? <HomePage /> : <LandingPage />}</main>
    </>
  );
};

export default Home;
