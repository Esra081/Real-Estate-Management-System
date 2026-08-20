using System;
using System.Text.RegularExpressions;

namespace REMS.API.Helpers
{
    public static class PasswordValidator
    {
        // SonarQube ReDoS (Zaman Aşımı Koruması) için 250ms sınır:
        private static readonly TimeSpan RegexTimeout = TimeSpan.FromMilliseconds(250);

        public static (bool Gecerli, string Hata) SifreGecerliMi(string sifre)
        {
            if (string.IsNullOrWhiteSpace(sifre) || sifre.Length < 8 || sifre.Length > 12)
            {
                return (false, "Şifre 8 ile 12 karakter arasında olmalıdır.");
            }

            // Regex ifadelerine timeout parametresi eklendi (SonarQube Security Hotspot çözümü)
            bool harfVarMi = Regex.IsMatch(sifre, @"[a-zA-Z]", RegexOptions.None, RegexTimeout);
            bool rakamVarMi = Regex.IsMatch(sifre, @"\d", RegexOptions.None, RegexTimeout);
            bool ozelKarakterVarMi = Regex.IsMatch(sifre, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]", RegexOptions.None, RegexTimeout);

            if (!harfVarMi || !rakamVarMi || !ozelKarakterVarMi)
            {
                return (false, "Şifre en az 1 harf, 1 rakam ve 1 özel karakter içermelidir.");
            }

            return (true, string.Empty);
        }
    }
}
