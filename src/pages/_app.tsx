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

  // Check if the current route matches a public page
  const isPublicPage = publicPages.includes(pathname);
  return (
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
      <Toaster position="bottom-right" />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
