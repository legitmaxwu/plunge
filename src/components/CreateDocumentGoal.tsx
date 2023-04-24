import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../utils/api";
import { Input } from "./base/Input";
import { Remarkable } from "remarkable";

interface FaviconAndTitleProps {
  url: string;
}
const FaviconAndTitle = (props: FaviconAndTitleProps) => {
  const { url } = props;

  const { data, error, isFetching } = api.public.fetchFaviconAndTitle.useQuery(
    {
      url,
    },
    {
      enabled: !!url,
    }
  );

  if (isFetching) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center bg-white/20 px-2 py-0.5"
    >
      <>
        <img
          src={data?.faviconUrl}
          alt="Favicon"
          style={{ width: "16px", height: "16px", marginRight: "8px" }}
        />
        <span>{data?.title}</span>
      </>
    </motion.div>
  );
};

interface WebsiteMarkdownProps {
  url: string;
}

function WebsiteMarkdown(props: WebsiteMarkdownProps) {
  const { url } = props;

  const { data, error, isFetching } = api.public.fetchMarkdown.useQuery(
    {
      url,
    },
    {
      enabled: !!url,
    }
  );

  const [html, setHtml] = useState("");

  useEffect(() => {
    const md = new Remarkable();
    const renderedHtml = md.render(data || "");
    setHtml(renderedHtml);
  }, [data]);

  if (isFetching) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-64 overflow-y-scroll bg-white/20 px-2 py-0.5"
    >
      <div
        className="markdown-div"
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
    </motion.div>
  );
}

export function CreateDocumentGoal() {
  const [url, setUrl] = useState("");
  return (
    <div className="">
      <div className="mb-1 text-sm font-bold">Enter a url:</div>
      <Input style={{ width: 500 }} value={url} onValueChange={setUrl} />
      {url && (
        <>
          <div className="h-4"></div>

          <FaviconAndTitle url={url} />

          <div className="h-8"></div>

          <WebsiteMarkdown url={url} />
        </>
      )}
    </div>
  );
}
//https://worldcoin.org/blog/engineering/intro-to-zkml
