// Next.js page

import { type NextPage } from "next";
import { useRouter } from "next/router";
import { Input } from "postcss";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/base/Accordion";
import { Button } from "../components/base/Button";
import { SidePadding } from "../components/layout/SidePadding";

const Learn: NextPage = () => {
  const router = useRouter();

  return (
    <div className="h-screen bg-gradient-to-r from-pink-200 to-sky-200">
      <SidePadding>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>lMao</AccordionTrigger>
            <AccordionContent>
              Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidePadding>
    </div>
  );
};

export default Learn;
