using Microsoft.AspNetCore.Mvc;
using REMS.API.Interfaces;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MahalleController : ControllerBase
    {
        private readonly IMahalleService _mahalleService;

        public MahalleController(IMahalleService mahalleService)
        {
            _mahalleService = mahalleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var mahalleler = await _mahalleService.GetAllAsync();

                return Ok(mahalleler);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = $"Mahalleler listelenirken hata oluştu: {ex.Message}"
                });
            }
        }

        [HttpGet("ilce/{ilceId}")]
        public async Task<IActionResult> GetByIlceId(int ilceId)
        {
            try
            {
                var mahalleler = await _mahalleService.GetByIlceIdAsync(ilceId);

                return Ok(mahalleler);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = $"Mahalleler getirilirken hata oluştu: {ex.Message}"
                });
            }
        }
    }
}