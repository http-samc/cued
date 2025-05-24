import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

import { Label } from "./label";
import { Slider } from "./slider";

const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

export { cn, Label, Slider };
