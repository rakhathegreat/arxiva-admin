import type { ReactNode } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";

interface SettingsSectionProps {
	id: string;
	title: string;
	description?: string;
	footer?: ReactNode;
	children: ReactNode;
}

/** Satu card pengaturan: judul dan isi vertikal, aksi di footer. */
export function SettingsSection({
	id,
	title,
	description,
	footer,
	children,
}: SettingsSectionProps) {
	return (
		<section aria-labelledby={`${id}-title`}>
			<Card>
				<CardHeader>
					<CardTitle id={`${id}-title`} className="font-medium">
						{title}
					</CardTitle>
					{description && (
						<CardDescription className="text-xs">{description}</CardDescription>
					)}
				</CardHeader>
				<CardContent className="flex flex-col gap-4">{children}</CardContent>
				{footer && (
					<CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
						{footer}
					</CardFooter>
				)}
			</Card>
		</section>
	);
}

interface SettingRowProps {
	id: string;
	label: string;
	hint?: ReactNode;
	children: ReactNode;
}

/** Satu field di dalam card: label, kontrol, dan hint opsional. */
export function SettingRow({ id, label, hint, children }: SettingRowProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={id} className="text-xs">
				{label}
			</Label>
			{children}
			{hint && <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
		</div>
	);
}
