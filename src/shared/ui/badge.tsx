import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
	"group/badge inline-flex items-center gap-1.5 rounded-sm border font-mono leading-none font-medium tracking-[0.06em] whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none [&>svg]:pointer-events-none",
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary text-primary-foreground",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground",
				destructive:
					"border-transparent bg-inverted text-inverted-foreground",
				outline: "border-border bg-transparent text-charcoal",
				ghost: "border-transparent text-charcoal",
				link: "border-transparent text-foreground underline-offset-4 hover:underline",
				success: "border-success/25 bg-success/10 text-success",
				info: "border-border bg-muted text-charcoal",
				warning: "border-border bg-foreground/5 text-foreground",
				danger: "border-transparent bg-inverted text-inverted-foreground",
				neutral: "border-border bg-muted text-stone",
			},
			size: {
				sm: "gap-1 px-1.5 py-1 text-[10px] [&>svg]:size-3!",
				md: "gap-1.5 px-2 py-1 text-[11px] [&>svg]:size-3.5!",
				lg: "gap-2 px-2.5 py-1.5 text-xs [&>svg]:size-4!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "sm",
		},
	},
);

export type BadgeVariant = NonNullable<
	VariantProps<typeof badgeVariants>["variant"]
>;

export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

function Badge({
	className,
	variant = "default",
	size = "sm",
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "span";

	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
