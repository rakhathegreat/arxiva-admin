type SaveExportFileOptions = {
  fileName: string
  contents: string | number[] | Uint8Array | ArrayBuffer
}

type SaveExportFileResult = {
  saved: boolean
}

/** Download file hasil ekspor langsung lewat browser (blob URL). */
export async function saveExportFile({
  fileName,
  contents,
}: SaveExportFileOptions): Promise<SaveExportFileResult> {
  const isXlsx = fileName.endsWith(".xlsx");
  const blobData = Array.isArray(contents) ? new Uint8Array(contents) : contents;
  const blob = new Blob([blobData], {
    type: isXlsx
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv;charset=utf-8",
  });

  try {
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    return { saved: true };
  } catch (error) {
    console.error("Gagal mengunduh file ekspor:", error);
    return { saved: false };
  }
}