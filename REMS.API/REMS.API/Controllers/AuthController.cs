using Microsoft.AspNetCore.Mvc;
using REMS.API.DTOs.Auth;
using REMS.API.Interfaces;

namespace REMS.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var token = await _authService.LoginAsync(model);

            if (token == null)
            {
                return Unauthorized(new { message = "E-posta veya şifre hatalı!" });
            }

            return Ok(new
            {
                token = token,
                message = "Giriş başarılı!"
            });
        }
    }
}