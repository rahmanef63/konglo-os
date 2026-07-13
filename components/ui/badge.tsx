import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 w-fit shrink-0 whitespace-nowrap rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      // Sole consumer is Pill (always outline); other shadcn variants removed.
      variant: {
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
