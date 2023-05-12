// @refresh reset
/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { handleError } from "../utils/handleError";
import clsx from "clsx";
import mobile from "is-mobile";
import { throttle } from "lodash";

type Coordinates = { x: number; y: number };

const fishGifs = [
  "/fish/fish-nemo.gif",
  "/fish/fish-dory.gif",
  "/fish/fish-brown.gif",
  "/fish/fish-yellow.gif",
];

const getRandomPosition = () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
});

const calculateDistance = (a: Coordinates, b: Coordinates) => {
  const x = a.x - b.x;
  const y = a.y - b.y;

  return Math.sqrt(x * x + y * y);
};

const randomNextPositionFrom = (currentPosition: Coordinates) => {
  const minX = Math.max(currentPosition.x - 50, 0);
  const maxX = Math.min(currentPosition.x + 50, 100);

  const minY = Math.max(currentPosition.y - 10, 0);
  const maxY = Math.min(currentPosition.y + 10, 100);

  // Randomly select a point within the bounds
  function select(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  return {
    x: select(minX, maxX),
    y: select(minY, maxY),
  };
};

function buildTransformString(props: { x: number; y: number }) {
  return `translate(${props.x}vw, ${props.y}vh)`;
}
interface MovingFishProps {
  src: string;
  initialPosition: Coordinates;
}

const MovingFish: React.FC<MovingFishProps> = ({ src, initialPosition }) => {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  const [direction, setDirection] = useState<"left" | "right">("right");

  const determineDirection = useCallback(
    (currPosition: Coordinates, nextPosition: Coordinates) => {
      if (currPosition.x > nextPosition.x) {
        setDirection("left");
      } else {
        setDirection("right");
      }
    },
    []
  );

  const travel = useCallback(
    async (recurse = false, speed = 1) => {
      const { x, y } = scope.current.getBoundingClientRect();
      const xVw = (x / window.innerWidth) * 100;
      const yVh = (y / window.innerHeight) * 100;
      const startPosition = { x: xVw, y: yVh };
      const endPosition = randomNextPositionFrom(startPosition);

      determineDirection(startPosition, endPosition);

      const distance = calculateDistance(startPosition, endPosition);

      const animationTimeMs = (distance * 400) / speed;

      // await new Promise((resolve) => {
      //   setTimeout(resolve, pauseTimeMs);
      // });
      animate(scope.current, {}).cancel();
      await animate(
        scope.current,
        {
          transform: buildTransformString({
            x: endPosition.x,
            y: endPosition.y,
          }),
        },
        {
          duration: animationTimeMs / 1000,
          ease: [0.23, 1, 0.32, 1], // Cubic-bezier easing function for "dart" effect
        }
      );

      if (recurse) {
        travel(true).catch(() => {
          // Ignore
        });
      }
      // await new Promise((resolve) => {
      //   setTimeout(resolve, animationTimeMs - endEarlyMs);
      // });

      // animate(scope.current, {}).cancel();

      // pointA = pointB;
      // pointB = randomNextPositionFrom(pointA);
      // determineDirection(pointA, pointB);
    },
    [animate, determineDirection, scope]
  );

  const throttledTravel = useMemo(
    () => throttle(travel, 1000, { trailing: true }),
    [travel]
  );

  // Every random interval, move the fish to a new position

  useEffect(() => {
    travel?.(true)?.catch(() => {
      // Ignore
    });
  }, [travel]);

  const handleHover = useCallback(() => {
    throttledTravel?.(false, 5)?.catch(() => {
      // Ignore
    });
  }, [throttledTravel]);

  return (
    <motion.div
      onMouseEnter={handleHover}
      ref={scope}
      initial={{
        transform: buildTransformString({
          x: initialPosition.x,
          y: initialPosition.y,
        }),
      }}
      className={clsx({
        "pointer-events-auto absolute h-auto w-16": true,
      })}
    >
      <img
        src={src}
        alt="Fish"
        style={{
          transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)",
        }}
      />
    </motion.div>
  );
};

type InitialFish = {
  initialPosition: Coordinates;
  src: string;
};

function generateNFish(n: number) {
  return Array.from({ length: n }).map((_, idx) => ({
    initialPosition: getRandomPosition(),
    src: fishGifs[idx % fishGifs.length] ?? "",
  }));
}

export const FishAnimation = () => {
  const [fishies, setFishies] = useState<InitialFish[]>([]);

  useEffect(() => {
    setFishies(generateNFish(mobile() ? 8 : 24));
    // setFishies(generateNFish(16));
  }, []);

  return (
    <div className="pointer-events-none absolute left-0 top-0 h-[calc(100dvh)] w-full overflow-hidden">
      {fishies.map((fish, i) => {
        return (
          <MovingFish
            key={i}
            src={fish.src}
            initialPosition={fish.initialPosition}
          />
        );
      })}
    </div>
  );
};
