export type EventStatus = "SUCCESS" | "FAILED";

export type ActorRole = "ADMIN" | "INTERNAL" | "MITRA";

export type LogRange = "today" | "7d" | "30d" | "all";

export type LogEntity =
	| "all"
	| "material"
	| "request"
	| "user"
	| "location"
	| "catalog"
	| "recon"
	| "auth"
	| "notification"
	| "file"
	| "system";

export type LogStatusFilter = "all" | EventStatus;

export interface SystemEvent {
	id: string;
	occurredAt: string;
	status: EventStatus;
	actorId: string | null;
	actorName: string | null;
	actorUsername: string | null;
	actorRole: ActorRole | null;
	action: string;
	entity: string;
	entityId: string | null;
	entityLabel: string | null;
	summary: string;
	httpMethod: string | null;
	httpPath: string | null;
	httpStatus: number | null;
	ipAddress: string | null;
	userAgent: string | null;
	metadata: Record<string, unknown> | null;
}

export interface LogPagination {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
}

export interface LogCounts {
	success: number;
	failed: number;
}

export interface LogListResponse {
	data: SystemEvent[];
	pagination: LogPagination;
	counts: LogCounts;
}

export interface LogQuery {
	page: number;
	limit: number;
	search: string;
	status: LogStatusFilter;
	entity: LogEntity;
	range: LogRange;
}
