import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<"table">>(
	({ className, ...props }, ref) => (
		<div data-slot="table-container" className="relative w-full overflow-x-auto">
			<table
				ref={ref}
				data-slot="table"
				className={cn("w-full caption-bottom text-sm", className)}
				{...props}
			/>
		</div>
	),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"thead">>(
	({ className, ...props }, ref) => (
		<thead ref={ref} data-slot="table-header" className={cn("", className)} {...props} />
	),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"tbody">>(
	({ className, ...props }, ref) => (
		<tbody
			ref={ref}
			data-slot="table-body"
			className={cn("[&_tr:last-child]:border-0", className)}
			{...props}
		/>
	),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.ComponentProps<"tfoot">>(
	({ className, ...props }, ref) => (
		<tfoot
			ref={ref}
			data-slot="table-footer"
			className={cn(
				"border-t border-border bg-muted/40 font-medium [&>tr]:last:border-b-0",
				className,
			)}
			{...props}
		/>
	),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentProps<"tr">>(
	({ className, ...props }, ref) => (
		<tr
			ref={ref}
			data-slot="table-row"
			className={cn(
				"transition-colors hover:bg-muted/50 has-aria-expanded:bg-transparent data-[state=selected]:bg-transparent",
				className,
			)}
			{...props}
		/>
	),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentProps<"th">>(
	({ className, ...props }, ref) => (
		<th
			ref={ref}
			data-slot="table-head"
			className={cn(
				"px-3 h-9 border border-border dark:border-muted text-left align-middle text-xs font-normal whitespace-nowrap text-muted-foreground has-[[role=checkbox]]:pr-0",
				className,
			)}
			{...props}
		/>
	),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentProps<"td">>(
	({ className, ...props }, ref) => (
		<td
			ref={ref}
			data-slot="table-cell"
			className={cn(
				"px-3 first:px-0 py-1 align-middle whitespace-nowrap has-[[role=checkbox]]:pr-0",
				className,
			)}
			{...props}
		/>
	),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.ComponentProps<"caption">>(
	({ className, ...props }, ref) => (
		<caption
			ref={ref}
			data-slot="table-caption"
			className={cn("mt-4 text-caption text-muted-foreground", className)}
			{...props}
		/>
	),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
