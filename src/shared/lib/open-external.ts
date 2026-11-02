/**
 * Buka URL eksternal di tab baru.
 *
 * Pengganti pembuka link eksternal bawaan desktop app setelah aplikasi
 * dijalankan sebagai web app biasa.
 */
export function openExternal(url: string) {
	const link = document.createElement("a");
	link.href = url;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	document.body.appendChild(link);
	link.click();
	link.remove();
}