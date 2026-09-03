using System.Security.Cryptography;
using System.Text;

namespace REMS.API.Services
{
    public class HashService
    {
        public string CreateSalt()
        {
            byte[] saltBytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(saltBytes);
        }

        public string HashPassword(string password, string salt)
        {
            var combinedBytes = Encoding.UTF8.GetBytes(password + salt);
            var hashBytes = SHA256.HashData(combinedBytes);
            return Convert.ToBase64String(hashBytes);
        }

        public bool VerifyPassword(string password, string storedHash, string storedSalt)
        {
            var hashOfInput = HashPassword(password, storedSalt);
            return hashOfInput == storedHash;
        }
    }
}