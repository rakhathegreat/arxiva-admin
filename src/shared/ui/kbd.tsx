import * as React from "react";
import { cn } from "@/shared/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center justify-center gap-1 rounded border border-border px-1.5 font-mono text-[10px] font-medium tracking-wide shadow-[0_1px_0_1px_rgba(0,0,0,0.02)]",
				className,
			)}
			{...props}
		/>
	);
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="kbd-group"
			className={cn("flex items-center gap-0.5", className)}
			{...props}
		/>
	);
}

export { Kbd, KbdGroup };

