"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit p-1", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn("absolute inset-x-0 top-0 flex items-center justify-between", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 text-muted-foreground hover:text-foreground",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8 text-muted-foreground hover:text-foreground",
          defaultClassNames.button_next
        ),
        month_caption: cn("flex h-8 items-center justify-center text-sm font-semibold", defaultClassNames.month_caption),
        caption_label: cn("text-sm font-semibold", defaultClassNames.caption_label),
        month_grid: cn("mt-1 w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn("w-9 flex-1 text-[0.7rem] font-medium text-muted-foreground uppercase", defaultClassNames.weekday),
        week: cn("mt-1.5 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-9 w-full flex-1 p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-full [&:last-child[data-selected=true]_button]:rounded-r-full",
          defaultClassNames.day
        ),
        day_button: cn(
          "flex size-9 items-center justify-center rounded-full text-sm font-normal transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:font-semibold group-data-[selected=true]/day:shadow-sm group-data-[selected=true]/day:hover:bg-primary",
          "group-data-[today=true]/day:border group-data-[today=true]/day:border-primary/60 group-data-[today=true]/day:font-semibold",
          "group-data-[disabled=true]/day:pointer-events-none group-data-[disabled=true]/day:text-muted-foreground/40",
          "group-data-[outside=true]/day:text-muted-foreground/40",
          defaultClassNames.day_button
        ),
        outside: cn("text-muted-foreground/40", defaultClassNames.outside),
        disabled: cn("text-muted-foreground/30", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="size-4" {...chevronProps} />
          ) : (
            <ChevronRightIcon className="size-4" {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
