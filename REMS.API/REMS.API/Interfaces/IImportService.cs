using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace REMS.API.Interfaces
{
    public interface IImportService
    {
        Task<(bool Success, string Message, int Count)> ImportTasinmazlarFromExcelAsync(IFormFile file, string kullaniciId);
    }
}