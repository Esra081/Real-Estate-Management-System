// Blob formatındaki veriyi tarayıcıda dosya olarak indirir
export function downloadBlob(blob: Blob, dosyaAdi: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = dosyaAdi;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
