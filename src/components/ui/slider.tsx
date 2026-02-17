import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showValue?: boolean
  marks?: number[]
  min?: number
  max?: number
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showValue, marks, min = 0, max = 100, value, ...props }, ref) => (
  <div className="relative w-full">
    {marks && marks.length > 0 && (
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-px pointer-events-none z-0">
        <div className="relative w-full h-full">
          {marks.map((mark) => {
            const percent = ((mark - min) / (max - min)) * 100
            return (
              <div
                key={mark}
                className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-muted-foreground/30"
                style={{ left: `${percent}%` }}
              />
            )
          })}
        </div>
      </div>
    )}
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-3",
        className
      )}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-muted-foreground/20">
        <SliderPrimitive.Range className="absolute h-full bg-muted-foreground/20" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="relative block h-3 w-3 rounded-full bg-primary ring-2 ring-background shadow-sm transition-all hover:scale-110 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50">
        {showValue && value && (
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-medium tabular-nums text-muted-foreground whitespace-nowrap">
            {value[0]}
          </span>
        )}
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  </div>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
