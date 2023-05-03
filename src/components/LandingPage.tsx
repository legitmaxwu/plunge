import React from "react";
import Head from "next/head";
import { Button } from "./base/Button";
import { SignIn, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";

const LandingPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-200 via-pink-300 to-sky-200">
      <div className="text-center">
        <h1 className="text-6xl font-bold">Plunge</h1>
        <p className="mt-4 text-2xl">Dive down the rabbit hole {":)"}.</p>
        <div className="h-16"></div>

        <SignIn />
      </div>
    </div>
  );
};

export default LandingPage;
