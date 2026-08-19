using REMS.API.DTOs.Property;
using System.Collections.Generic;

namespace REMS.API.Interfaces
{
    public interface IExportService
    {
        byte[] ExportTasinmazlarToExcel(IEnumerable<TasinmazListDto> tasinmazlar);

        byte[] ExportTasinmazlarToPdf(IEnumerable<TasinmazListDto> tasinmazlar);
    }
}
