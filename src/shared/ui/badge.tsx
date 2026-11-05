import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

/**
 * The tone is a badge's only chromatic axis. Each tone resolves — through
 * the `data-tone` hooks in App.css — to a text-grade shade in light theme
 * and a lifted shade in dark theme, so a 10px mono label keeps its
 * contrast on any surface without per-call-site color utilities.
 */
export const BADGE_TONES = [
	"slate",
	"zinc",
	"blue",
	"indigo",
	"violet",
	"fuchsia",
	"pink",
	"rose",
	"red",
	"orange",
	"amber",
	"lime",
	"emerald",
	"teal",
	"cyan",
	"sky",
] as const;

export type BadgeTone = (typeof BADGE_TONES)[number];

export interface BadgeToneStyle {
	glass: string;
	quiet: string;
}

/**
 * Modular tone color definitions for both `glass` and `quiet` badge variants.
 * Easily modifiable and extensible with new semantic hues.
 */
export const BADGE_TONE_STYLES: Record<BadgeTone, BadgeToneStyle> = {
	slate: {
		glass: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:border-slate-400/10 dark:bg-slate-400/15 dark:text-slate-300",
		quiet: "border-slate-500/20 bg-slate-500/5 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-400",
	},
	zinc: {
		glass: "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:border-zinc-400/10 dark:bg-zinc-400/15 dark:text-zinc-300",
		quiet: "border-zinc-500/20 bg-zinc-500/5 text-zinc-600 dark:border-zinc-400/20 dark:bg-zinc-400/10 dark:text-zinc-400",
	},
	blue: {
		glass: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/10 dark:bg-blue-400/15 dark:text-blue-300",
		quiet: "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400",
	},
	indigo: {
		glass: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/10 dark:bg-indigo-400/15 dark:text-indigo-300",
		quiet: "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-400",
	},
	violet: {
		glass: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-300",
		quiet: "border-violet-500/20 bg-violet-500/5 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-400",
	},
	fuchsia: {
		glass: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:border-fuchsia-400/25 dark:bg-fuchsia-400/15 dark:text-fuchsia-300",
		quiet: "border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-600 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-400",
	},
	pink: {
		glass: "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:border-pink-400/25 dark:bg-pink-400/15 dark:text-pink-300",
		quiet: "border-pink-500/20 bg-pink-500/5 text-pink-600 dark:border-pink-400/20 dark:bg-pink-400/10 dark:text-pink-400",
	},
	rose: {
		glass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/15 dark:text-rose-300",
		quiet: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-400",
	},
	red: {
		glass: "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/25 dark:bg-red-400/15 dark:text-red-300",
		quiet: "border-red-500/20 bg-red-500/5 text-red-600 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-400",
	},
	orange: {
		glass: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:border-orange-400/10 dark:bg-orange-400/15 dark:text-orange-300",
		quiet: "border-orange-500/20 bg-orange-500/5 text-orange-600 dark:border-orange-400/10 dark:bg-orange-400/10 dark:text-orange-400",
	},
	amber: {
		glass: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-300",
		quiet: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-400",
	},
	lime: {
		glass: "border-lime-600/20 bg-lime-500/10 text-lime-800 dark:border-lime-400/10 dark:bg-lime-400/15 dark:text-lime-300",
		quiet: "border-lime-600/20 bg-lime-500/5 text-lime-700 dark:border-lime-400/20 dark:bg-lime-400/10 dark:text-lime-400",
	},
	emerald: {
		glass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/10 dark:bg-emerald-400/15 dark:text-emerald-300",
		quiet: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-400",
	},
	teal: {
		glass: "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:border-teal-400/10 dark:bg-teal-400/15 dark:text-teal-300",
		quiet: "border-teal-500/20 bg-teal-500/5 text-teal-600 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-400",
	},
	cyan: {
		glass: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:border-cyan-400/10 dark:bg-cyan-400/15 dark:text-cyan-300",
		quiet: "border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-400",
	},
	sky: {
		glass: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/10 dark:bg-sky-400/15 dark:text-sky-300",
		quiet: "border-sky-500/20 bg-sky-500/5 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-400",
	},
};

/** Dapatkan kelas Tailwind untuk tone dan varian badge secara modular. */
export function getBadgeToneClasses(
	tone: BadgeTone = "slate",
	variant: "glass" | "quiet" = "glass",
): string {
	return BADGE_TONE_STYLES[tone]?.[variant] ?? BADGE_TONE_STYLES.slate.glass;
}

const badgeVariants = cva(
	"group/badge inline-flex shrink-0 items-center justify-center gap-1 rounded-full whitespace-nowrap tabular-nums transition-[background-color,border-color,color] duration-150 ease-out select-none focus-visible:ring-2 focus-visible:ring-ring/10 focus-visible:outline-none border",
	{
		variants: {
			/**
			 * `glass` — the tinted frosted pill (the default look).
			 * `quiet` — its outlined sibling for counts and secondary labels.
			 * `ink`   — inverted; the strongest stamp, used sparingly.
			 * `secondary` — subtle alias for secondary badges.
			 */
			variant: {
				glass: "shadow-xs backdrop-blur-xs",
				quiet: "border-0",
				ink: "border-transparent bg-foreground text-background",
				secondary: "",
				default: "shadow-xs backdrop-blur-xs",
			},
			size: {
				sm: "h-[18px] px-2 text-xs",
				md: "h-[22px] px-2.5 text-xs",
				lg: "h-[26px] px-3 text-sm",
			},
		},
		defaultVariants: {
			variant: "glass",
			size: "sm",
		},
	},
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

const VARIANT_TONE: Record<BadgeVariant, BadgeTone> = {
	glass: "slate",
	quiet: "zinc",
	ink: "slate",
	secondary: "slate",
	default: "slate",
};

export interface BadgeProps
	extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
	asChild?: boolean;
	/** Hue of the pill. Defaults per variant; pass one for semantic states. */
	tone?: BadgeTone;
}

function Badge({
	className,
	variant = "glass",
	size = "sm",
	tone,
	asChild = false,
	...props
}: BadgeProps) {
	const Comp = asChild ? Slot.Root : "span";
	const resolvedVariant = variant ?? "glass";
	const resolvedTone = tone ?? VARIANT_TONE[resolvedVariant] ?? "slate";

	const toneStyle =
		resolvedVariant === "ink"
			? ""
			: (BADGE_TONE_STYLES[resolvedTone]?.[resolvedVariant === "quiet" ? "quiet" : "glass"] ??
				BADGE_TONE_STYLES.slate.glass);

	return (
		<Comp
			data-slot="badge"
			data-variant={resolvedVariant}
			data-tone={resolvedTone}
			className={cn(badgeVariants({ variant: resolvedVariant, size }), toneStyle, className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
