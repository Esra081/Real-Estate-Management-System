using REMS.API.DTOs.Auth;

namespace REMS.API.Interfaces
{
    public interface IGirisService
    {
        Task<string?> LoginAsync(LoginDto model);
    }
}