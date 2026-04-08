'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  className?: string
}

export default function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, (v: number) => Math.round(v))
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = display.on('change', (v: number) => setCurrent(v))
    return unsubscribe
  }, [display])

  return (
    <motion.span className={className}>
      {current}
    </motion.span>
  )
}
