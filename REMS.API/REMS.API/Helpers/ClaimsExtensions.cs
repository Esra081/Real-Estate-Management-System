using System.Security.Claims;

namespace REMS.API.Helpers
{
    public static class ClaimsExtensions
    {
        public static string? GetUserId(this ClaimsPrincipal? user)
        {
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value
                ?? user.FindFirst("id")?.Value;
        }

        public static string? GetUserEmail(this ClaimsPrincipal? user)
        {
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.Email)?.Value
                ?? user.FindFirst("email")?.Value;
        }

        public static string? GetUserRole(this ClaimsPrincipal? user)
        {
            if (user == null) return null;

            return user.FindFirst(ClaimTypes.Role)?.Value
                ?? user.FindFirst("role")?.Value;
        }
    }
}