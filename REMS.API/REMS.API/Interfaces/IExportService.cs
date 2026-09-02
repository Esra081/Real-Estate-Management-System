using REMS.API.DTOs.Property;
using REMS.API.DTOs.Log;
using System.Collections.Generic;

namespace REMS.API.Interfaces
{
    public interface IExportService
    {
        byte[] ExportTasinmazlarToExcel(IEnumerable<TasinmazListDto> tasinmazlar);
        byte[] ExportLogsToExcel(IEnumerable<LogListDto> loglar, string? filtreOzeti = null);
        byte[] ExportTasinmazlarToPdf(IEnumerable<TasinmazListDto> tasinmazlar);
        byte[] ExportLogsToPdf(IEnumerable<LogListDto> loglar, string? filtreOzeti = null);
    }
}