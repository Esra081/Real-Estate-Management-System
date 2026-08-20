using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.Log;
using REMS.API.Interfaces;

namespace REMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // 👈 Sadece Admin rolüne sahip kullanıcılar logları görebilir
    public class LogController : ControllerBase
    {
        private readonly ILogService _logService;

        public LogController(ILogService logService)
        {
            _logService = logService;
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