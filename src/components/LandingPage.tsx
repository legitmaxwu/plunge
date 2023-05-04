/* eslint-disable @next/next/no-img-element */
import React from "react";
import Head from "next/head";
import { Button } from "./base/Button";
import { SignIn, useClerk, useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import ReactPlayer from "react-player";
import { handleError } from "../utils/handleError";

const LandingPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const router = useRouter();
  const { signIn } = useSignIn();
  const clerk = useClerk();
  return (
    <div className="flex h-screen flex-col items-center bg-gradient-to-r from-gray-200 via-sky-300 to-blue-300">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-bold text-blue-950">Plunge 🤿</h1>
        <p className="text-2xl text-gray-600">explore your curiosity {":)"}</p>
        <div className="h-12"></div>
        <button
          className="flex items-center gap-2 rounded-md bg-white/20 px-6 py-2 transition hover:bg-white/40"
          onClick={() => {
            signIn
              ?.authenticateWithRedirect({
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/",
                strategy: "oauth_google" as const,
              })
              .catch(handleError);
          }}
        >
          <img src="/google.png" className="h-4 w-4" alt="google logo" />
          Sign in with Google
        </button>
        <div className="h-16"></div>
        <div className="relative aspect-video h-96 xl:h-120 2xl:h-160">
          <div className="h-full w-full animate-pulse rounded-sm bg-black/10"></div>
          <ReactPlayer
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
            controls={true}
            width="100%"
            height="100%"
            url="https://www.youtube.com/watch?v=UWUu5KI7_U4"
          />
        </div>
      </div>
      \
    </div>
  );
};

export default LandingPage;
