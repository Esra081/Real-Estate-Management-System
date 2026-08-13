using Microsoft.AspNetCore.Mvc;
using REMS.API.Interfaces;
using REMS.API.Services;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IlController : ControllerBase
    {
        private readonly IIlService _ilService;

        public IlController(IIlService ilService)
        {
            _ilService = ilService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var iller = await _ilService.GetAllAsync();

                return Ok(iller);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = $"İller listelenirken hata oluştu: {ex.Message}"
                });
            }
        }
    }
}