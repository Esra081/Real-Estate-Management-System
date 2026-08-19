using ClosedXML.Excel;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using REMS.API.DTOs.Property;
using REMS.API.Interfaces;
using System;
using System.Collections.Generic;
using System.IO;

namespace REMS.API.Services
{
    public class ExportService : IExportService
    {
        // 1. EXCEL ÇIKTISI ÜRETME (ClosedXML)
        public byte[] ExportTasinmazlarToExcel(IEnumerable<TasinmazListDto> tasinmazlar)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Taşınmaz Listesi");

            // 1. Başlık Satırları
            var headers = new string[]
            {
                "ID", "İl", "İlçe", "Mahalle", "Ada No", "Parsel No", "Taşınmaz Tipi", "Alan (m²)", "Adres", "Koordinatlar"
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1976D2");
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            // 2. Veri Satırlarını Doldurma
            int row = 2;
            foreach (var item in tasinmazlar)
            {
                worksheet.Cell(row, 1).Value = item.Id;
                worksheet.Cell(row, 2).Value = item.IlAdi ?? "";
                worksheet.Cell(row, 3).Value = item.IlceAdi ?? "";
                worksheet.Cell(row, 4).Value = item.MahalleAdi ?? "";
                worksheet.Cell(row, 5).Value = item.AdaNo ?? "";
                worksheet.Cell(row, 6).Value = item.ParselNo ?? "";
                worksheet.Cell(row, 7).Value = item.TasinmazTipi ?? "";
                worksheet.Cell(row, 8).Value = item.AlanM2 ?? 0;
                worksheet.Cell(row, 9).Value = item.Adres ?? "";

                string koordinatStr = "";
                if (item.Koordinatlar != null && item.Koordinatlar.Any())
                {
                    koordinatStr = string.Join("; ", item.Koordinatlar.Select(k => 
                        $"{k[0].ToString(System.Globalization.CultureInfo.InvariantCulture)},{k[1].ToString(System.Globalization.CultureInfo.InvariantCulture)}"));
                }
                worksheet.Cell(row, 10).Value = koordinatStr;

                row++;
            }

            // Sütun genişliklerini içeriğe göre otomatik ayarla
            worksheet.Columns().AdjustToContents();

            // Dosyayı hafızadaki stream'e yazıp byte[] olarak döndür
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        // 2. PDF ÇIKTISI ÜRETME
        public byte[] ExportTasinmazlarToPdf(IEnumerable<TasinmazListDto> tasinmazlar)
        {
            using var document = new PdfDocument();
            document.Info.Title = "Taşınmaz Listesi Raporu";

            // Sayfayı yatay (Landscape) açıyoruz ki tablomuz ferah sığsın
            var page = document.AddPage();
            page.Orientation = PdfSharpCore.PageOrientation.Landscape;

            var gfx = XGraphics.FromPdfPage(page);
            var titleFont = new XFont("Arial", 14, XFontStyle.Bold);
            var headerFont = new XFont("Arial", 9, XFontStyle.Bold);
            var regularFont = new XFont("Arial", 8, XFontStyle.Regular);

            // Başlık Çizimi
            gfx.DrawString("GAYRİMENKUL YÖNETİM SİSTEMİ - TAŞINMAZ LİSTESİ", titleFont, XBrushes.DarkBlue, new XPoint(30, 40));
            gfx.DrawString($"Rapor Tarihi: {DateTime.Now:dd.MM.yyyy HH:mm}", regularFont, XBrushes.Gray, new XPoint(650, 40));

            // Tablo Başlangıç Koordinatları
            double currentY = 70;
            double[] colX = { 30, 60, 130, 210, 310, 370, 430, 520, 580 }; // Sütun X başlangıçları
            string[] headers = { "ID", "İl", "İlçe", "Mahalle", "Ada", "Parsel", "Tip", "Alan(m²)", "Adres" };

            // Başlık Arka Planı ve Yazıları
            gfx.DrawRectangle(new XSolidBrush(XColor.FromArgb(25, 118, 210)), 30, currentY - 14, 780, 20);
            for (int i = 0; i < headers.Length; i++)
            {
                gfx.DrawString(headers[i], headerFont, XBrushes.White, new XPoint(colX[i] + 2, currentY));
            }

            currentY += 15;

            // Tablo Satırları
            int rowIndex = 0;
            foreach (var item in tasinmazlar)
            {
                // Sayfa sonuna gelindiyse yeni sayfa ekle
                if (currentY > 530)
                {
                    page = document.AddPage();
                    page.Orientation = PdfSharpCore.PageOrientation.Landscape;
                    gfx = XGraphics.FromPdfPage(page);
                    currentY = 50;
                }

                // Satır arkaplanı zebra deseni (okunabilirliği artırır)
                if (rowIndex % 2 == 1)
                {
                    gfx.DrawRectangle(new XSolidBrush(XColor.FromArgb(245, 245, 245)), 30, currentY - 12, 780, 16);
                }

                gfx.DrawString(item.Id.ToString(), regularFont, XBrushes.Black, new XPoint(colX[0] + 2, currentY));
                gfx.DrawString(item.IlAdi ?? "", regularFont, XBrushes.Black, new XPoint(colX[1] + 2, currentY));
                gfx.DrawString(item.IlceAdi ?? "", regularFont, XBrushes.Black, new XPoint(colX[2] + 2, currentY));
                gfx.DrawString(item.MahalleAdi ?? "", regularFont, XBrushes.Black, new XPoint(colX[3] + 2, currentY));
                gfx.DrawString(item.AdaNo ?? "", regularFont, XBrushes.Black, new XPoint(colX[4] + 2, currentY));
                gfx.DrawString(item.ParselNo ?? "", regularFont, XBrushes.Black, new XPoint(colX[5] + 2, currentY));
                gfx.DrawString(item.TasinmazTipi ?? "", regularFont, XBrushes.Black, new XPoint(colX[6] + 2, currentY));
                gfx.DrawString((item.AlanM2 ?? 0).ToString("N2"), regularFont, XBrushes.Black, new XPoint(colX[7] + 2, currentY));

                // Adres uzunsa taşmasın diye ilk 30 karakteri alıyoruz
                string adresKisa = (item.Adres?.Length > 30) ? item.Adres.Substring(0, 27) + "..." : (item.Adres ?? "");
                gfx.DrawString(adresKisa, regularFont, XBrushes.Black, new XPoint(colX[8] + 2, currentY));

                currentY += 16;
                rowIndex++;
            }

            using var stream = new MemoryStream();
            document.Save(stream, false);
            return stream.ToArray();
        }
    }
}