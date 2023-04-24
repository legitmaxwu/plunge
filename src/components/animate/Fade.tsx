import { type HTMLMotionProps, motion } from "framer-motion";

type FadeProps = HTMLMotionProps<"div">;

export function Fade(props: FadeProps) {
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: props.transition ?? 0.3 }}
    />
  );
}
