using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.Log;
using REMS.API.Interfaces;
using REMS.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace REMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class LogController : ControllerBase
    {
        private readonly ILogService _logService;
        private readonly IExportService _exportService;

        public LogController(ILogService logService, IExportService exportService)
        {
            _logService = logService;
            _exportService = exportService;
        }

        [HttpGet]
        public async Task<IActionResult> GetLogs([FromQuery] LogFilterDto filter)
        {
            try
            {
                var result = await _logService.GetLogsAsync(filter);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Loglar listelenirken bir hata oluştu.", error = ex.Message });
            }
        }

        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportToExcel([FromQuery] LogFilterDto filter)
        {
            try
            {
                filter.PageSize = int.MaxValue;
                filter.PageNumber = 1;
                var pagedResult = await _logService.GetLogsAsync(filter);
                string filtreOzeti = FiltreOzetiniUret(filter);
                var excelBytes = _exportService.ExportLogsToExcel(pagedResult.Data, filtreOzeti);

                await _logService.LogAsync("Excel Dışa Aktarma", $"Sistem logları Excel dosyası olarak indirildi. (Filtre: {filtreOzeti})", "Basarili");

                return File(
                    excelBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"Sistem_Loglari_{DateTime.Now:yyyyMMdd_HHmm}.xlsx"
                );
            }
            catch (Exception ex)
            {
                await _logService.LogAsync("Excel Dışa Aktarma", $"Loglar Excel'e aktarılırken hata oluştu: {ex.Message}", "Basarisiz");
                return StatusCode(500, new { message = "Dışa aktarma başarısız oldu." });
            }
        }

        [HttpGet("export/pdf")]
        public async Task<IActionResult> ExportToPdf([FromQuery] LogFilterDto filter)
        {
            try
            {
                filter.PageSize = int.MaxValue;
                filter.PageNumber = 1;
                var pagedResult = await _logService.GetLogsAsync(filter);
                string filtreOzeti = FiltreOzetiniUret(filter);
                var pdfBytes = _exportService.ExportLogsToPdf(pagedResult.Data, filtreOzeti);

                await _logService.LogAsync("PDF Dışa Aktarma", $"Sistem logları PDF raporu olarak indirildi. (Filtre: {filtreOzeti})", "Basarili");

                return File(
                    pdfBytes,
                    "application/pdf",
                    $"Sistem_Loglari_{DateTime.Now:yyyyMMdd_HHmm}.pdf"
                );
            }
            catch (Exception ex)
            {
                await _logService.LogAsync("PDF Dışa Aktarma", $"Loglar PDF'e aktarılırken hata oluştu: {ex.Message}", "Basarisiz");
                return StatusCode(500, new { message = "Dışa aktarma başarısız oldu." });
            }
        }

        [HttpGet("islem-tipleri")]
        public IActionResult GetIslemTipleri()
        {
            var tipler = new List<string>
            {
                "Giriş",
                "Kayıt",
                "Taşınmaz Ekleme",
                "Taşınmaz Güncelleme",
                "Taşınmaz Silme",
                "Toplu Taşınmaz Silme",
                "Kullanıcı Ekleme",
                "Kullanıcı Güncelleme",
                "Kullanıcı Silme",
                "Excel Dışa Aktarma",
                "PDF Dışa Aktarma",
                "Excel İçe Aktarma"
            };

            return Ok(tipler);
        }

        private static string FiltreOzetiniUret(LogFilterDto filter)
        {
            var kriterler = new List<string>();

            if (!string.IsNullOrWhiteSpace(filter.IslemTipi))
                kriterler.Add($"İşlem Tipi: {filter.IslemTipi}");

            if (!string.IsNullOrWhiteSpace(filter.Durum))
                kriterler.Add($"Durum: {filter.Durum}");

            if (filter.BaslangicTarihi.HasValue && filter.BitisTarihi.HasValue)
                kriterler.Add($"Tarih: {filter.BaslangicTarihi:dd.MM.yyyy} - {filter.BitisTarihi:dd.MM.yyyy}");
            else if (filter.BaslangicTarihi.HasValue)
                kriterler.Add($"Başlangıç: {filter.BaslangicTarihi:dd.MM.yyyy}");
            else if (filter.BitisTarihi.HasValue)
                kriterler.Add($"Bitiş: {filter.BitisTarihi:dd.MM.yyyy}");

            if (!string.IsNullOrWhiteSpace(filter.IpAdresi))
                kriterler.Add($"IP: {filter.IpAdresi}");

            if (!string.IsNullOrWhiteSpace(filter.AramaMetni))
                kriterler.Add($"Arama: '{filter.AramaMetni}'");

            return kriterler.Count > 0 ? string.Join(" | ", kriterler) : "Tüm Kayıtlar (Filtresiz)";
        }
    }
}