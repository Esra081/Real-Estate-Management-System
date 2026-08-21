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
    [Authorize(Roles = "Admin")] // 👈 Sadece Admin rolüne sahip kullanıcılar logları görebilir
    public class LogController : ControllerBase
    {
        private readonly ILogService _logService;
        private readonly IExportService _exportService;

        public LogController(ILogService logService, IExportService exportService)
        {
            _logService = logService;
            _exportService = exportService;
        }

        // GET: api/Log?PageNumber=1&PageSize=20&IslemTipi=Giriş&Durum=Basarili
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

        // GET: api/Log/export/excel (Logları Excel Olarak İndirme)
        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportToExcel([FromQuery] LogFilterDto filter)
        {
            // Sayfalama sınırını kaldırıp filtrelenen tüm kayıtları çekiyoruz:
            filter.PageSize = int.MaxValue;
            filter.PageNumber = 1;
            var pagedResult = await _logService.GetLogsAsync(filter);
            var excelBytes = _exportService.ExportLogsToExcel(pagedResult.Data);
            // İndirme işlemini de logluyoruz:
            await _logService.LogAsync("Excel Dışa Aktarma", "Sistem logları Excel dosyası olarak indirildi.", "Basarili");
            // Dosyayı kullanıcıya fırlatıyoruz:
            return File(
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Sistem_Loglari_{DateTime.Now:yyyyMMdd_HHmm}.xlsx"
            );


        }        // GET: api/Log/export/pdf (Logları PDF Raporu Olarak İndirme)
        [HttpGet("export/pdf")]
        public async Task<IActionResult> ExportToPdf([FromQuery] LogFilterDto filter)
        {
            // 1. Sayfalama sınırını kaldırıp filtrelenen TÜM kayıtları çekiyoruz:
            filter.PageSize = int.MaxValue;
            filter.PageNumber = 1;

            var pagedResult = await _logService.GetLogsAsync(filter);

            // 2. ExportService'deki PDF üretme motorunu çalıştırıyoruz:
            var pdfBytes = _exportService.ExportLogsToPdf(pagedResult.Data);

            // 3. Bu indirme hareketini de sisteme logluyoruz:
            await _logService.LogAsync("PDF Dışa Aktarma", "Sistem logları PDF raporu olarak indirildi.", "Basarili");

            // 4. Tarayıcıya 'application/pdf' formatında teslim ediyoruz:
            return File(
                pdfBytes,
                "application/pdf",
                $"Sistem_Loglari_{DateTime.Now:yyyyMMdd_HHmm}.pdf"
            );
        }


        // GET: api/Log/islem-tipleri (Filtreleme dropdown'ı için sabit işlem tipleri)
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
    }
}