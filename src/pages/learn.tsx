// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { Button } from "../components/base/Button";
import { SidePadding } from "../components/layout/SidePadding";

const Learn: NextPage = () => {
  const router = useRouter();

  return (
    <div className="h-screen bg-gradient-to-r from-pink-200 to-sky-200">
      <SidePadding>
        <Button
          onClick={() => {
            router.push("/create/custom").catch((err) => {
              console.error(err);
            });
          }}
        >
          Set a new goal
        </Button>
      </SidePadding>
    </div>
  );
};

export default Learn;
