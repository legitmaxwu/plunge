// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { CreateGoal } from "../../components/CreateGoal";

const Create: NextPage = () => {
  const router = useRouter();

  return (
    <div className="h-screen bg-gradient-to-r from-pink-200 to-sky-200">
      <div className="flex h-full flex-col items-center justify-center">
        <CreateGoal />
      </div>
    </div>
  );
};

export default Create;
