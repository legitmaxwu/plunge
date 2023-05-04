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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-200 via-sky-300 to-blue-300">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-950">Plunge 🤿</h1>
        <p className="text-2xl text-gray-600">
          dive into your curiosities {":)"}
        </p>
        <div className="h-16"></div>

        <SignIn />
      </div>
    </div>
  );
};

export default LandingPage;
