"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import Image from "next/image";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-[300px] w-full items-center justify-center overflow-hidden p-10"
      ref={containerRef}
    >
      <div className="flex size-full max-h-[200px] max-w-lg flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <Icons.database />
          </Circle>
          <Circle ref={div5Ref}>
            <Icons.analytics />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <Icons.production />
          </Circle>
          <Circle ref={div4Ref} className="size-16">
            <Icons.dashboard />
          </Circle>
          <Circle ref={div6Ref}>
            <Icons.reports />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref}>
            <Icons.materials />
          </Circle>
          <Circle ref={div7Ref}>
            <Icons.planning />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        reverse
      />
    </div>
  );
}

// Componente para ícones PNG customizados
const CustomIcon = ({ src, alt, className }: { 
  src: string; 
  alt: string; 
  className?: string;
}) => (
  <Image
    src={src}
    alt={alt}
    width={100}
    height={100}
    className={cn("object-contain", className)}
    loading="lazy"
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
  />
);

const Icons = {
  // Para usar suas imagens PNG, coloque-as na pasta public/icons/
  dashboard: () => (
    <CustomIcon 
      src="/icons/dashboard.png" 
      alt="Dashboard"
      className="w-14 h-14" // MUITO maior - 56px
    />
  ),
  database: () => (
    <CustomIcon 
      src="/icons/database.png" 
      alt="Database"
      className="w-11 h-11" // Maior - 44px
    />
  ),
  production: () => (
    <CustomIcon 
      src="/icons/production.png" 
      alt="Production"
      className="w-11 h-11" // Maior - 44px
    />
  ),
  materials: () => (
    <CustomIcon 
      src="/icons/materials.png" 
      alt="Materials"
      className="w-11 h-11" // Maior - 44px
    />
  ),
  analytics: () => (
    <CustomIcon 
      src="/icons/analytics.png" 
      alt="Analytics"
      className="w-11 h-11" // Maior - 44px
    />
  ),
  reports: () => (
    <CustomIcon 
      src="/icons/reports.png" 
      alt="Reports"
      className="w-11 h-11" // Maior - 44px
    />
  ),
  planning: () => (
    <CustomIcon 
      src="/icons/planning.png" 
      alt="Planning"
      className="w-11 h-11" // Maior - 44px
    />
  ),
};
