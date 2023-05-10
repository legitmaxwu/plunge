// @refresh reset
/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { handleError } from "../utils/handleError";
import clsx from "clsx";
import mobile from "is-mobile";

type Coordinates = { x: number; y: number };
const fishGifs = [
  "/fish/fish-nemo.gif",
  "/fish/fish-dory.gif",
  "/fish/fish-brown.gif",
  "/fish/fish-yellow.gif",
];

const randomPosition = () => ({
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
  const [scope, animate] = useAnimate();

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

  const initialize = useCallback(async () => {
    // await animate({
    //   x: `${initialPosition.x}vw`,
    //   y: `${initialPosition.y}vh`,
    // });
    let pointA = initialPosition;
    let pointB = randomNextPositionFrom(pointA);
    determineDirection(pointA, pointB);

    // 50% chance to wait before starting
    // const wait = Math.random() > 0.5;
    // if (wait) {
    //   const randomPauseTime = Math.random() * 1000;
    //   await new Promise((resolve) => {
    //     setTimeout(resolve, randomPauseTime);
    //   });
    // }

    while (true) {
      // Wait random amount of time
      // Random time between 0 and 2 seconds

      const distance = calculateDistance(pointA, pointB);

      const animationTimeMs = distance * 500;

      const endEarlyMs = (Math.random() / 30) * animationTimeMs;

      // await new Promise((resolve) => {
      //   setTimeout(resolve, pauseTimeMs);
      // });
      await animate(
        scope.current,
        {
          transform: buildTransformString({
            x: pointB.x,
            y: pointB.y,
          }),
        },
        {
          duration: animationTimeMs / 1000,
          ease: [0.23, 1, 0.32, 1], // Cubic-bezier easing function for "dart" effect
        }
      );

      console.log("Lmfao");
      // await new Promise((resolve) => {
      //   setTimeout(resolve, animationTimeMs - endEarlyMs);
      // });

      animate(scope.current, {}).cancel();

      pointA = pointB;
      pointB = randomNextPositionFrom(pointA);
      determineDirection(pointA, pointB);
    }
  }, [animate, determineDirection, initialPosition, scope]);

  useEffect(() => {
    initialize().catch(() => {
      // Ignore
    });
  }, [initialize]);

  return (
    <motion.div
      ref={scope}
      className={clsx({
        "absolute h-auto w-16": true,
      })}
      style={{
        transform: buildTransformString({
          x: initialPosition.x,
          y: initialPosition.y,
        }),
      }}
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
    initialPosition: randomPosition(),
    src: fishGifs[idx % fishGifs.length] ?? "",
  }));
}

export const FishAnimation = () => {
  const [fishies, setFishies] = useState<InitialFish[]>([]);

  useEffect(() => {
    setFishies(generateNFish(mobile() ? 8 : 24));
  }, []);

  return (
    <div className="pointer-events-none fixed left-0 top-0 h-screen w-full">
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
