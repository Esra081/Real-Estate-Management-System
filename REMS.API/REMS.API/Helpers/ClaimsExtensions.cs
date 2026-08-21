using System.Security.Claims;

namespace REMS.API.Helpers
{
    public static class ClaimsExtensions
    {
        // 1. Kullanıcı ID'sini getirir (Token içindeki NameIdentifier, sub veya id)
        public static string? GetUserId(this ClaimsPrincipal? user)
        {
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value
                ?? user.FindFirst("id")?.Value;
        }

        // 2. Kullanıcı E-postasını getirir
        public static string? GetUserEmail(this ClaimsPrincipal? user)
        {
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.Email)?.Value
                ?? user.FindFirst("email")?.Value;
        }

        // 3. Kullanıcının Rolünü getirir (Admin / User)
        public static string? GetUserRole(this ClaimsPrincipal? user)
        {
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.Role)?.Value
                ?? user.FindFirst("role")?.Value;
        }
    }
}