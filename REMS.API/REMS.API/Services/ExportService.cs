using ClosedXML.Excel;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using REMS.API.DTOs.Log;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace REMS.API.Services
{
    public class ExportService : IExportService
    {
        // 1. TAŞINMAZ EXCEL ÇIKTISI
        public byte[] ExportTasinmazlarToExcel(IEnumerable<TasinmazListDto> tasinmazlar)
        {
            var headers = new[] { "ID", "İl", "İlçe", "Mahalle", "Ada No", "Parsel No", "Taşınmaz Tipi", "Alan (m²)", "Adres", "Koordinatlar" };

            return GenerateExcel("Taşınmaz Listesi", headers, tasinmazlar, (ws, row, item) =>
            {
                ws.Cell(row, 1).Value = item.Id;
                ws.Cell(row, 2).Value = item.IlAdi ?? "";
                ws.Cell(row, 3).Value = item.IlceAdi ?? "";
                ws.Cell(row, 4).Value = item.MahalleAdi ?? "";
                ws.Cell(row, 5).Value = item.AdaNo ?? "";
                ws.Cell(row, 6).Value = item.ParselNo ?? "";
                ws.Cell(row, 7).Value = item.TasinmazTipi ?? "";
                ws.Cell(row, 8).Value = item.AlanM2 ?? 0;
                ws.Cell(row, 9).Value = item.Adres ?? "";

                string koordinatStr = item.Koordinatlar != null && item.Koordinatlar.Any()
                    ? string.Join("; ", item.Koordinatlar.Select(k => $"{k[0].ToString(CultureInfo.InvariantCulture)},{k[1].ToString(CultureInfo.InvariantCulture)}"))
                    : "";
                ws.Cell(row, 10).Value = koordinatStr;
            });
        }

        // 2. LOG EXCEL ÇIKTISI
        public byte[] ExportLogsToExcel(IEnumerable<LogListDto> loglar, string? filtreOzeti = null)
        {
            var headers = new[] { "ID", "Tarih", "Kullanıcı Adı", "E-Posta", "İşlem Tipi", "Durum", "IP Adresi", "Açıklama" };

            return GenerateExcel("Sistem Logları", headers, loglar, (ws, row, l) =>
            {
                ws.Cell(row, 1).Value = l.Id;
                ws.Cell(row, 2).Value = l.Tarih.ToString("dd.MM.yyyy HH:mm:ss");
                ws.Cell(row, 3).Value = l.KullaniciAdi ?? "Sistem";
                ws.Cell(row, 4).Value = l.KullaniciEmail ?? "-";
                ws.Cell(row, 5).Value = l.IslemTipi ?? "";
                ws.Cell(row, 6).Value = l.Durum ?? "";
                ws.Cell(row, 7).Value = l.IpAdresi ?? "-";
                ws.Cell(row, 8).Value = l.Aciklama ?? "";
            }, "REMS GIS - SİSTEM DENETİM VE GÜVENLİK LOGLARI RAPORU", filtreOzeti);
        }

        // 3. TAŞINMAZ PDF ÇIKTISI
        public byte[] ExportTasinmazlarToPdf(IEnumerable<TasinmazListDto> tasinmazlar)
        {
            string[] headers = { "ID", "İl", "İlçe", "Mahalle", "Ada", "Parsel", "Tip", "Alan(m²)", "Adres" };
            double[] colX = { 30, 60, 130, 210, 310, 370, 430, 520, 580 };

            return GeneratePdf("GAYRİMENKUL YÖNETİM SİSTEMİ - TAŞINMAZ LİSTESİ", headers, colX, tasinmazlar, (gfx, currentY, cols, font, item) =>
            {
                gfx.DrawString(item.Id.ToString(), font, XBrushes.Black, new XPoint(cols[0] + 2, currentY));
                gfx.DrawString(item.IlAdi ?? "", font, XBrushes.Black, new XPoint(cols[1] + 2, currentY));
                gfx.DrawString(item.IlceAdi ?? "", font, XBrushes.Black, new XPoint(cols[2] + 2, currentY));
                gfx.DrawString(item.MahalleAdi ?? "", font, XBrushes.Black, new XPoint(cols[3] + 2, currentY));
                gfx.DrawString(item.AdaNo ?? "", font, XBrushes.Black, new XPoint(cols[4] + 2, currentY));
                gfx.DrawString(item.ParselNo ?? "", font, XBrushes.Black, new XPoint(cols[5] + 2, currentY));
                gfx.DrawString(item.TasinmazTipi ?? "", font, XBrushes.Black, new XPoint(cols[6] + 2, currentY));
                gfx.DrawString((item.AlanM2 ?? 0).ToString("N2"), font, XBrushes.Black, new XPoint(cols[7] + 2, currentY));

                string adresKisa = (item.Adres?.Length > 30) ? item.Adres.Substring(0, 27) + "..." : (item.Adres ?? "");
                gfx.DrawString(adresKisa, font, XBrushes.Black, new XPoint(cols[8] + 2, currentY));
            });
        }

        // 4. LOG PDF ÇIKTISI
        public byte[] ExportLogsToPdf(IEnumerable<LogListDto> loglar, string? filtreOzeti = null)
        {
            string[] headers = { "ID", "Tarih", "Kullanıcı", "İşlem Tipi", "Durum", "IP Adresi", "Açıklama" };
            double[] colX = { 30, 60, 160, 270, 380, 450, 520 };

            return GeneratePdf("REMS GIS - SİSTEM DENETİM VE GÜVENLİK LOGLARI", headers, colX, loglar, (gfx, currentY, cols, font, item) =>
            {
                gfx.DrawString(item.Id.ToString(), font, XBrushes.Black, new XPoint(cols[0] + 2, currentY));
                gfx.DrawString(item.Tarih.ToString("dd.MM.yyyy HH:mm"), font, XBrushes.Black, new XPoint(cols[1] + 2, currentY));
                gfx.DrawString(item.KullaniciAdi ?? (item.KullaniciEmail ?? "Sistem"), font, XBrushes.Black, new XPoint(cols[2] + 2, currentY));
                gfx.DrawString(item.IslemTipi ?? "", font, XBrushes.Black, new XPoint(cols[3] + 2, currentY));
                gfx.DrawString(item.Durum ?? "", font, XBrushes.Black, new XPoint(cols[4] + 2, currentY));
                gfx.DrawString(item.IpAdresi ?? "-", font, XBrushes.Black, new XPoint(cols[5] + 2, currentY));

                string aciklamaKisa = (item.Aciklama?.Length > 50) ? item.Aciklama.Substring(0, 47) + "..." : (item.Aciklama ?? "");
                gfx.DrawString(aciklamaKisa, font, XBrushes.Black, new XPoint(cols[6] + 2, currentY));
            }, filtreOzeti);
        }

        // MERKEZİ GENERIC EXCEL ÜRETİCİSİ
        private static byte[] GenerateExcel<T>(
            string sheetName,
            string[] headers,
            IEnumerable<T> items,
            Action<IXLWorksheet, int, T> mapRow,
            string? reportTitle = null,
            string? filtreOzeti = null)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add(sheetName);

            int startRow = 1;

            if (!string.IsNullOrWhiteSpace(reportTitle))
            {
                // 1. Satır: Rapor Ana Başlığı
                var titleRange = worksheet.Range(1, 1, 1, headers.Length);
                titleRange.Merge();
                titleRange.Value = reportTitle;
                titleRange.Style.Font.Bold = true;
                titleRange.Style.Font.FontSize = 14;
                titleRange.Style.Font.FontColor = XLColor.FromHtml("#1565C0");
                titleRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;

                // 2. Satır: Uygulanan Filtre Bilgisi ve Rapor Tarihi
                var filterCell = worksheet.Cell(2, 1);
                filterCell.Value = $"Uygulanan Filtre: {(string.IsNullOrWhiteSpace(filtreOzeti) ? "Tüm Kayıtlar" : filtreOzeti)} | Rapor Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}";
                filterCell.Style.Font.Italic = true;
                filterCell.Style.Font.FontSize = 10;
                filterCell.Style.Font.FontColor = XLColor.Gray;

                worksheet.Range(2, 1, 2, headers.Length).Merge();

                startRow = 4; // Tablo başlıkları 4. satırdan başlasın
            }

            // Tablo Başlıkları
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(startRow, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1976D2");
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            int row = startRow + 1;
            foreach (var item in items)
            {
                mapRow(worksheet, row, item);
                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        // MERKEZİ GENERIC PDF ÜRETİCİSİ
        private static byte[] GeneratePdf<T>(
            string title,
            string[] headers,
            double[] colX,
            IEnumerable<T> items,
            Action<XGraphics, double, double[], XFont, T> drawRow,
            string? filtreOzeti = null)
        {
            using var document = new PdfDocument();
            document.Info.Title = title;

            var page = document.AddPage();
            page.Orientation = PdfSharpCore.PageOrientation.Landscape;

            var gfx = XGraphics.FromPdfPage(page);
            var titleFont = new XFont("Arial", 13, XFontStyle.Bold);
            var subtitleFont = new XFont("Arial", 8, XFontStyle.Italic);
            var headerFont = new XFont("Arial", 9, XFontStyle.Bold);
            var regularFont = new XFont("Arial", 8, XFontStyle.Regular);

            // Başlık
            gfx.DrawString(title, titleFont, XBrushes.DarkBlue, new XPoint(30, 32));
            gfx.DrawString($"Rapor Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}", regularFont, XBrushes.Gray, new XPoint(650, 32));

            // Filtre Bilgisi Alt Başlığı
            if (!string.IsNullOrWhiteSpace(filtreOzeti))
            {
                gfx.DrawString($"Uygulanan Filtre: {filtreOzeti}", subtitleFont, XBrushes.DarkSlateGray, new XPoint(30, 48));
            }

            double currentY = !string.IsNullOrWhiteSpace(filtreOzeti) ? 68 : 58;
            DrawHeaderBar(gfx, headers, colX, headerFont, currentY);
            currentY += 15;

            int rowIndex = 0;
            foreach (var item in items)
            {
                if (currentY > 530)
                {
                    page = document.AddPage();
                    page.Orientation = PdfSharpCore.PageOrientation.Landscape;
                    gfx = XGraphics.FromPdfPage(page);
                    currentY = 45;
                    DrawHeaderBar(gfx, headers, colX, headerFont, currentY);
                    currentY += 15;
                }

                if (rowIndex % 2 == 1)
                {
                    gfx.DrawRectangle(new XSolidBrush(XColor.FromArgb(245, 245, 245)), 30, currentY - 12, 780, 16);
                }

                drawRow(gfx, currentY, colX, regularFont, item);

                currentY += 16;
                rowIndex++;
            }

            using var stream = new MemoryStream();
            document.Save(stream, false);
            return stream.ToArray();
        }

        private static void DrawHeaderBar(XGraphics gfx, string[] headers, double[] colX, XFont font, double y)
        {
            gfx.DrawRectangle(new XSolidBrush(XColor.FromArgb(25, 118, 210)), 30, y - 14, 780, 20);
            for (int i = 0; i < headers.Length; i++)
            {
                gfx.DrawString(headers[i], font, XBrushes.White, new XPoint(colX[i] + 2, y));
            }
        }
    }
}