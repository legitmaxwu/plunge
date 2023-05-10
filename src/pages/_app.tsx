import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import "~/styles/diff.css";

import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  useUser,
} from "@clerk/nextjs";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { TooltipProvider } from "../components/base/Tooltip";
import ReactPlayer from "react-player";

const RenderComponent: AppType = (props) => {
  const { Component, pageProps } = props;

  const { isLoaded } = useUser();

  if (!isLoaded) {
    return null;
  }
  return <Component {...pageProps} />;
};

const publicPages = ["/"];

const MyApp: AppType = (props) => {
  const { Component, pageProps } = props;

  const { pathname } = useRouter();

  const show = useMediaQuery(
    {
      showIfBiggerThan: "md",
    },
    true
  );

  // Check if the current route matches a public page
  const isPublicPage = publicPages.includes(pathname);
  return (
    <>
      <Head>
        <title>Plunge</title>
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
      <TooltipProvider delayDuration={0}>
        <ClerkProvider {...pageProps}>
          {isPublicPage ? (
            <RenderComponent {...props} />
          ) : (
            <>
              <SignedIn>
                <RenderComponent {...props} />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn redirectUrl={"/"} />
              </SignedOut>
            </>
          )}
          <Toaster />
        </ClerkProvider>
      </TooltipProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
