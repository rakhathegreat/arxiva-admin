import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/shared/ui/status-badge";
import { cn } from "@/shared/lib/utils";
import type { SystemEvent } from "../types";
import { actionLabel, entityLabel, formatLogDateParts, roleLabel, statusLabel } from "../utils/log";

function DetailRow({
	label,
	value,
	mono,
	className,
}: {
	label: string;
	value: ReactNode;
	mono?: boolean;
	className?: string;
}) {
	const isEmpty = value === null || value === undefined || value === "";

	return (
		<div className={className}>
			<p className="meta-label">{label}</p>
			<p
				className={cn(
					"mt-1 text-sm break-words",
					mono && "font-mono text-xs break-all tabular-nums",
					isEmpty ? "text-muted-foreground" : "text-foreground",
				)}
			>
				{isEmpty ? "-" : value}
			</p>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0">
			<h3 className="mb-3 text-sm font-medium tracking-tight text-foreground">{title}</h3>
			{children}
		</section>
	);
}

export function LogDetailDialog({
	event,
	onOpenChange,
}: {
	event: SystemEvent | null;
	onOpenChange: (open: boolean) => void;
}) {
	const metadata = event?.metadata ? JSON.stringify(event.metadata, null, 2) : null;

	return (
		<Dialog open={Boolean(event)} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[85vh]">
				<DialogHeader className="shrink-0 gap-2 border-b border-border px-5 py-4 text-left sm:px-6">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<DialogTitle className="truncate text-base font-medium tracking-tight text-foreground">
								{event ? actionLabel(event.action) : "Detail log"}
							</DialogTitle>
							<DialogDescription className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
								{event ? formatLogDateParts(event.occurredAt).full : "-"}
							</DialogDescription>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							{event ? (
								<StatusBadge
									status={event.status}
									label={statusLabel(event.status)}
									variant="quiet"
									size="md"
								/>
							) : null}
							<DialogClose asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									className="text-muted-foreground hover:text-foreground"
									aria-label="Tutup"
								>
									<X className="size-4" />
								</Button>
							</DialogClose>
						</div>
					</div>
					{event ? (
						<p className="text-xs text-muted-foreground">{event.summary}</p>
					) : null}
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
					<Section title="Aktor">
						<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
							<DetailRow label="Nama" value={event?.actorName} />
							<DetailRow label="Username" value={event?.actorUsername} mono />
							<DetailRow
								label="Role"
								value={event?.actorRole ? roleLabel(event.actorRole) : null}
							/>
							<DetailRow label="ID Aktor" value={event?.actorId} mono />
						</div>
					</Section>

					<Section title="Entitas">
						<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
							<DetailRow
								label="Tipe"
								value={event ? entityLabel(event.entity) : null}
							/>
							<DetailRow label="Label" value={event?.entityLabel} />
							<DetailRow label="ID Entitas" value={event?.entityId} mono />
							<DetailRow label="Kunci Aksi" value={event?.action} mono />
						</div>
					</Section>

					<Section title="Permintaan">
						<div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
							<DetailRow label="Metode" value={event?.httpMethod} mono />
							<DetailRow
								label="Status HTTP"
								value={event?.httpStatus != null ? String(event.httpStatus) : null}
								mono
							/>
							<DetailRow label="IP" value={event?.ipAddress} mono />
							<DetailRow
								label="User Agent"
								value={event?.userAgent}
								className="sm:col-span-2"
							/>
							<DetailRow
								label="Path"
								value={event?.httpPath}
								mono
								className="sm:col-span-2"
							/>
						</div>
					</Section>

					<Section title="Metadata">
						{metadata ? (
							<pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-foreground">
								{metadata}
							</pre>
						) : (
							<p className="text-xs text-muted-foreground">Tidak ada metadata.</p>
						)}
					</Section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
