import { type FC, useState, useEffect } from "react";
import { type ReactNode, type CSSProperties } from "react";
import { useRandomInterval } from "../hooks/useRandomInterval";
import { motion, type MotionStyle } from "framer-motion";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Fade } from "./animate/Fade";

const DEFAULT_COLOR = "#ffef93";

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min;

type SparkleItem = {
  id: string;
  createdAt: number;
  color: string;
  size: number;
  style: {
    top: string;
    left: string;
  };
};
const generateSparkle = (color: string): SparkleItem => {
  const sparkle = {
    id: String(random(10000, 99999)),
    createdAt: Date.now(),
    color,
    size: random(10, 20),
    style: {
      top: random(0, 100).toString() + "%",
      left: random(0, 100).toString() + "%",
    },
  };
  return sparkle;
};

interface SparklesProps {
  color?: string;
  children: ReactNode;
  enabled?: boolean;
  frequency?: number;
  starsPerCycle?: number;
}

export const Sparkles: FC<SparklesProps> = ({
  color = DEFAULT_COLOR,
  enabled = true,
  frequency = 1,
  starsPerCycle = 1,
  children,
  ...delegated
}) => {
  const [sparkles, setSparkles] = useState<SparkleItem[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  useRandomInterval(
    () => {
      const now = Date.now();

      setSparkles((prev) => {
        const next = prev.filter((sp) => {
          const delta = now - sp.createdAt;
          return delta < 1250;
        });
        if (enabled) {
          for (let i = 0; i < starsPerCycle; i++) {
            const sparkle = generateSparkle(color);
            next.push(sparkle);
          }
        }
        return next;
      });
    },
    prefersReducedMotion ? null : 500 / frequency,
    prefersReducedMotion ? null : 750 / frequency
  );

  return (
    <span className="relative inline-block" {...delegated}>
      {sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          color={sparkle.color}
          size={sparkle.size}
          style={sparkle.style}
        />
      ))}
      <div className="relative z-10">{children}</div>
    </span>
  );
};

interface SparkleProps {
  color: string;
  size: number;
  style: CSSProperties;
}

const Sparkle: FC<SparkleProps> = ({ color, size, style }) => {
  const sparkleVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 },
  };

  const sparkleTransition = {
    duration: 0.7,
    ease: "easeInOut",
  };

  const sparkleRotate = {
    rotate: [0, 180],
  };

  const motionStyle: MotionStyle = {
    position: "absolute",
    width: size,
    height: size,
    translateX: "-50%",
    translateY: "-50%",
    fill: color,
    ...style,
  };

  return (
    <motion.span
      style={motionStyle}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={sparkleVariants}
      transition={sparkleTransition}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 68 68"
        fill="none"
        animate={sparkleRotate}
        transition={{ rotate: { duration: 2, ease: "linear", loop: Infinity } }}
      >
        <path
          d="M26.5 25.5C19.0043 33.3697 0 34 0 34C0 34 19.1013 35.3684 26.5 43.5C33.234 50.901 34 68 34 68C34 68 36.9884 50.7065 44.5 43.5C51.6431 36.647 68 34 68 34C68 34 51.6947 32.0939 44.5 25.5C36.5605 18.2235 34 0 34 0C34 0 33.6591 17.9837 26.5 25.5Z"
          fill={color}
          stroke="#FFF176" // Use a lighter yellow for the stroke color
          strokeWidth="2" // Add a strokeWidth
        />
      </motion.svg>
    </motion.span>
  );
};
