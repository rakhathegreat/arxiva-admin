import * as React from "react";

/**
 * Cache ukuran halaman terakhir agar permintaan pertama saat mount
 * tidak memakai nilai default (menghindari fetch ganda).
 */
export const AUTO_PAGE_SIZE_STORAGE_KEY = "arxiva:auto-page-size";

export function readCachedAutoPageSize(fallback = 10) {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = window.localStorage.getItem(AUTO_PAGE_SIZE_STORAGE_KEY);
		const parsed = raw ? Number.parseInt(raw, 10) : NaN;
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	} catch {
		return fallback;
	}
}

function writeCachedAutoPageSize(size: number) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(AUTO_PAGE_SIZE_STORAGE_KEY, String(size));
	} catch {
		/* abaikan: storage bisa diblokir */
	}
}

function px(value: string) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

/** Selisih (px) yang masih dianggap "pas" agar tidak terjadi osilasi. */
const FIT_EPSILON = 0.5;

export interface UseAutoPageSizeOptions {
	/** Root DataTable — dipakai untuk mencari kontainer induk & jarak antar-anak. */
	rootRef: React.RefObject<HTMLElement | null>;
	/** Elemen area tabel; tepi atasnya jadi awal ruang yang dihitung. */
	areaRef: React.RefObject<HTMLElement | null>;
	/** Baris paginasi di bawah tabel — tingginya dikurangkan. */
	paginationRef?: React.RefObject<HTMLElement | null>;
	/** Header tabel sticky — tingginya dikurangkan. */
	headerRef?: React.RefObject<HTMLElement | null>;
	/** Tinggi minimum satu baris data (px); pitch nyata diukur dari DOM. */
	rowHeight?: number;
	/** Jumlah baris yang sedang dirender (untuk tahu apakah halaman penuh). */
	currentPageSize?: number;
	min?: number;
	max?: number;
	enabled?: boolean;
	/** Toleransi perubahan (baris) agar animasi sidebar/resize kecil tidak memicu refetch. */
	tolerance?: number;
}

export interface UseAutoPageSizeResult {
	/** Jumlah baris yang pas untuk ruang tersedia. */
	pageSize: number;
	/** Tinggi maksimum area tabel (header + baris) agar tidak ada ruang kosong. */
	maxHeight: number | undefined;
	/** true setelah pengukuran pertama selesai. */
	isMeasured: boolean;
}

/**
 * Menghitung "baris per halaman" dari tinggi pixel yang tersedia sehingga
 * tabel selalu terisi penuh tanpa scroll halaman, tanpa user memilih manual.
 *
 * Dua hal penting:
 * 1. Ruang diukur relatif kontainer induk (bukan tinggi tabel) karena tinggi
 *    tabel mengikuti isi — kalau diukur dari dirinya sendiri tidak akan bertambah.
 * 2. Pitch baris diambil dari hasil render nyata (`table` − `thead`)/jumlah
 *    baris, bukan dari `rowHeight` teoretis. Dengan `border-collapse` tinggi
 *    baris nyata bisa beberapa px lebih kecil, dan selisih itu persis yang
 *    dulu menyisakan ruang untuk satu baris tambahan.
 */
export function useAutoPageSize({
	rootRef,
	areaRef,
	paginationRef,
	headerRef,
	rowHeight = 40,
	currentPageSize = 0,
	min = 3,
	max = 100,
	enabled = false,
	tolerance = 0,
}: UseAutoPageSizeOptions): UseAutoPageSizeResult {
	// null = belum terukur (jangan menimpa ukuran awal sebelum ada angka valid).
	const [measured, setMeasured] = React.useState<{
		pageSize: number;
		maxHeight: number;
	} | null>(null);

	const measure = React.useCallback(() => {
		const root = rootRef.current;
		const area = areaRef.current;
		const parent = root?.parentElement;
		if (!root || !area || !parent) return;

		const parentStyle = window.getComputedStyle(parent);
		const paddingTop = px(parentStyle.paddingTop);
		const paddingBottom = px(parentStyle.paddingBottom);

		const parentRect = parent.getBoundingClientRect();
		const areaRect = area.getBoundingClientRect();

		const paginationEl = paginationRef?.current ?? null;
		const paginationHeight = paginationEl?.offsetHeight ?? 0;
		// Jarak antar-anak diambil dari gap flex container bila ada.
		const rowGap = paginationEl ? px(window.getComputedStyle(root).rowGap) : 0;

		// Posisi area tabel di dalam konten induk — tidak terpengaruh scroll.
		const offsetFromTop = areaRect.top - parentRect.top - paddingTop + parent.scrollTop;
		const contentHeight = parent.clientHeight - paddingTop - paddingBottom;

		const available =
			contentHeight > 0
				? contentHeight - offsetFromTop - paginationHeight - rowGap
				: // Induk tidak dibatasi tinggi (auto): pakai sisa viewport.
					window.innerHeight - areaRect.top - paginationHeight - rowGap;

		if (available <= 0) return;

		const headerHeight = headerRef?.current?.offsetHeight ?? 0;

		// --- Pitch baris nyata dari DOM -------------------------------------
		const tableEl = area.querySelector("table");
		const tbodyEl = area.querySelector("tbody");
		const renderedRows = tbodyEl ? tbodyEl.children.length : 0;
		const tableHeight = tableEl?.getBoundingClientRect().height ?? 0;

		let pitch = rowHeight;
		if (renderedRows > 0 && tableHeight > 0) {
			const measuredPitch = (tableHeight - headerHeight) / renderedRows;
			if (measuredPitch > 1) pitch = measuredPitch;
		}

		// Posisi baris saat ini: kalau halaman penuh, pakai jumlah baris nyata +
		// sisa ruang; kalau tidak (halaman terakhir), pakai hitungan geometri.
		const isFullPage = renderedRows > 0 && renderedRows >= Math.max(1, currentPageSize);
		const usable = available - headerHeight;

		let rows: number;
		if (isFullPage) {
			const leftover = available - tableHeight;
			if (leftover >= pitch - FIT_EPSILON) {
				rows = renderedRows + Math.floor((leftover + FIT_EPSILON) / pitch);
			} else if (leftover < -FIT_EPSILON) {
				rows = renderedRows - Math.ceil((-leftover - FIT_EPSILON) / pitch);
			} else {
				rows = renderedRows;
			}
		} else {
			rows = Math.floor((usable + FIT_EPSILON) / pitch);
		}

		rows = Math.max(min, Math.min(max, rows));
		if (!Number.isFinite(rows) || rows <= 0) return;

		const maxHeight = Math.min(
			Math.ceil(headerHeight + rows * pitch),
			Math.floor(available),
		);

		setMeasured((prev) => {
			if (prev && prev.pageSize === rows && prev.maxHeight === maxHeight) return prev;
			// Abaikan perubahan kecil (mis. 1 baris) agar animasi tidak memicu refetch.
			if (prev && Math.abs(prev.pageSize - rows) <= tolerance) return prev;
			return { pageSize: rows, maxHeight };
		});
	}, [
		rootRef,
		areaRef,
		paginationRef,
		headerRef,
		rowHeight,
		currentPageSize,
		min,
		max,
		tolerance,
	]);

	React.useEffect(() => {
		if (!enabled) return;
		const root = rootRef.current;
		if (!root) return;

		let frame = 0;
		const schedule = () => {
			if (frame) cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				frame = 0;
				measure();
			});
		};

		schedule();

		const observer = new ResizeObserver(schedule);
		observer.observe(root);
		if (root.parentElement) observer.observe(root.parentElement);
		if (areaRef.current) observer.observe(areaRef.current);
		if (headerRef?.current) observer.observe(headerRef.current);
		if (paginationRef?.current) observer.observe(paginationRef.current);

		window.addEventListener("resize", schedule);
		return () => {
			if (frame) cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("resize", schedule);
		};
	}, [enabled, rootRef, areaRef, paginationRef, headerRef, measure]);

	React.useEffect(() => {
		if (!enabled || !measured) return;
		writeCachedAutoPageSize(measured.pageSize);
	}, [enabled, measured]);

	if (!enabled) {
		return { pageSize: 0, maxHeight: undefined, isMeasured: false };
	}

	return {
		pageSize: measured?.pageSize ?? 0,
		maxHeight: measured?.maxHeight,
		isMeasured: measured !== null,
	};
}
