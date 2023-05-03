// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { CreateGoal } from "../../components/CreateGoal";

const Create: NextPage = () => {
  return (
    <div className="h-screen bg-gradient-to-r from-sky-200 to-blue-200">
      <div className="flex h-full flex-col items-center justify-center">
        <div className="h-2"></div>
        <CreateGoal />
      </div>
    </div>
  );
};

export default Create;
