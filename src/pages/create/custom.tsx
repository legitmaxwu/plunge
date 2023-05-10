// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { CreateGoal } from "../../components/CreateGoal";
import { Navbar } from "../../components/Navbar";

const Create: NextPage = () => {
  return (
    <div className="flex h-screen flex-col bg-gradient-to-r from-sky-200 to-blue-200">
      <Navbar />
      <div className="flex h-full flex-1 flex-col items-center justify-center px-4">
        <CreateGoal />
        <div className="h-14"></div>
      </div>
    </div>
  );
};

export default Create;
