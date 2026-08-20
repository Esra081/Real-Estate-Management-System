using REMS.API.DTOs;
using REMS.API.DTOs.Auth;

namespace REMS.API.Interfaces
{
    public interface IGirisService
    {
        Task<string?> LoginAsync(LoginDto model);
        Task<(bool Success, string Message)> RegisterAsync(RegisterDto request);
    }
}