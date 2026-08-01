"use client";

import { animate, domAnimation, LazyMotion, m, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

type AnimatedNumberProps = {
  readonly value: number;
  readonly format?: (value: number) => string;
  readonly className?: string;
};

const defaultFormat = (value: number): string => Math.round(value).toLocaleString("zh-CN");

export function AnimatedNumber({ value, format = defaultFormat, className }: AnimatedNumberProps) {
  const animatedValue = useMotionValue(value);
  const displayValue = useTransform(animatedValue, (current) => format(Math.round(current)));

  useEffect(() => {
    const controls = animate(animatedValue, value, {
      duration: 0.32,
      ease: [0.2, 0.8, 0.2, 1],
    });
    return () => {
      controls.stop();
    };
  }, [animatedValue, value]);

  return (
    <LazyMotion features={domAnimation} strict>
      <m.span className={className}>{displayValue}</m.span>
    </LazyMotion>
  );
}
