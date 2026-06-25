"use client"

import React, { useEffect, useRef } from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"

// Simple class name merger helper
function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}

interface CursorCardsContainerProps {
  children: React.ReactNode
  className?: string
  proximityRange?: number // Kept for API compatibility
}

interface CursorCardProps {
  children?: React.ReactNode
  className?: string
  illuminationRadius?: number
  illuminationColor?: string
  illuminationOpacity?: number
  primaryHue?: string
  secondaryHue?: string
  borderColor?: string
}

export function CursorCardsContainer({
  children,
  className,
}: CursorCardsContainerProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  )
}

export function CursorCard({
  children,
  className,
  illuminationRadius = 200,
  illuminationColor = "#FFFFFF10",
  illuminationOpacity = 0.8,
  primaryHue = "#cc44dbff",
  secondaryHue = "#6d38c8ff",
  borderColor = "#c806beff",
}: CursorCardProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  // Motion values for high performance pointer tracking without React state updates
  const localMouseX = useMotionValue(-illuminationRadius)
  const localMouseY = useMotionValue(-illuminationRadius)
  const illuminationOpacityMotion = useMotionValue(0)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      localMouseX.set(x)
      localMouseY.set(y)
    }

    const handlePointerEnter = () => {
      illuminationOpacityMotion.set(illuminationOpacity)
    }

    const handlePointerLeave = () => {
      illuminationOpacityMotion.set(0)
      localMouseX.set(-illuminationRadius)
      localMouseY.set(-illuminationRadius)
    }

    el.addEventListener("pointermove", handlePointerMove)
    el.addEventListener("pointerenter", handlePointerEnter)
    el.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      el.removeEventListener("pointermove", handlePointerMove)
      el.removeEventListener("pointerenter", handlePointerEnter)
      el.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [illuminationRadius, illuminationOpacity, localMouseX, localMouseY, illuminationOpacityMotion])

  const gradientBackground = useMotionTemplate`
    radial-gradient(${illuminationRadius}px circle at ${localMouseX}px ${localMouseY}px,
    ${primaryHue}, 
    ${secondaryHue},
    ${borderColor} 100%
    )
  `

  const illuminationBackground = useMotionTemplate`
    radial-gradient(${illuminationRadius}px circle at ${localMouseX}px ${localMouseY}px, 
    ${illuminationColor}, transparent 100%)
  `

  return (
    <div
      ref={elementRef}
      className={cn("group relative rounded-[inherit]", className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: gradientBackground }}
      />
      <div className="absolute inset-px rounded-[inherit] bg-white" />
      <motion.div
        className="pointer-events-none absolute inset-px rounded-[inherit] transition-opacity duration-300"
        style={{
          background: illuminationBackground,
          opacity: illuminationOpacityMotion,
        }}
      />
      <div className="relative h-full flex flex-col">{children}</div>
    </div>
  )
}
