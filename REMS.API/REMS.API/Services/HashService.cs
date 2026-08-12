using System.Security.Cryptography;
using System.Text;

namespace REMS.API.Services
{
    public class HashService
    {
        // Yeni bir kayıt veya şifre değişiminde rastgele Salt (tuz) üretir
        public string CreateSalt()
        {
            byte[] saltBytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(saltBytes);
        }

        // Girilen düz şifreyi ve salt değerini birleştirip SHA-256 ile hash'ler
        public string HashPassword(string password, string salt)
        {
            var combinedBytes = Encoding.UTF8.GetBytes(password + salt);
            var hashBytes = SHA256.HashData(combinedBytes);
            return Convert.ToBase64String(hashBytes);
        }

        // Kullanıcı giriş yaparken girilen şifrenin veritabanındaki hash ile uyuşup uyuşmadığını doğrular
        public bool VerifyPassword(string password, string storedHash, string storedSalt)
        {
            var hashOfInput = HashPassword(password, storedSalt);
            return hashOfInput == storedHash;
        }
    }
}