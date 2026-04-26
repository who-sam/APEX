import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="group block h-5 w-5 rounded-full bg-primary ring-4 ring-primary/0 ring-offset-0 shadow-md shadow-primary/30 transition-[transform,box-shadow,ring-width] duration-150 ease-out hover:ring-primary/20 hover:shadow-lg hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-primary/40 active:scale-110 active:ring-8 active:ring-primary/30 active:shadow-xl active:shadow-primary/50 data-[state=active]:scale-110 data-[state=active]:ring-8 data-[state=active]:ring-primary/30 cursor-grab active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
