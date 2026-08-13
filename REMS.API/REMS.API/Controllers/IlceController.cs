using Microsoft.AspNetCore.Mvc;
using REMS.API.Interfaces;
using REMS.API.Services;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IlceController : ControllerBase
    {
        private readonly IIlceService _ilceService;

        public IlceController(IIlceService ilceService)
        {
            _ilceService = ilceService;
        }

        [HttpGet("il/{ilId}")]
        public async Task<IActionResult> GetByIlId(int ilId)
        {
            try
            {
                var ilceler = await _ilceService.GetByIlIdAsync(ilId);

                return Ok(ilceler);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = $"İlçeler listelenirken hata oluştu: {ex.Message}"
                });
            }
        }
    }
}