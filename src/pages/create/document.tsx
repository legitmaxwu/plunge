// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { CreateDocumentGoal } from "../../components/CreateDocumentGoal";
import { CreateGoal } from "../../components/CreateGoal";

const Create: NextPage = () => {
  const router = useRouter();

  return (
    <div className="h-[calc(100dvh)] bg-gradient-to-r from-pink-200 to-sky-200">
      <div className="flex h-full flex-col items-center justify-center">
        <CreateDocumentGoal />
      </div>
    </div>
  );
};

export default Create;
