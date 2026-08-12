using REMS.API.DTOs.Auth;

namespace REMS.API.Interfaces
{
    public interface IAuthService
    {
        Task<string?> LoginAsync(LoginDto model);
    }
}