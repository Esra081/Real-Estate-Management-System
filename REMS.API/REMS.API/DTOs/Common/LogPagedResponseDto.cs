using REMS.API.DTOs.Log;

namespace REMS.API.DTOs.Common
{
    public class LogPagedResponseDto : PagedResponseDto<LogListDto>
    {
        public int BasariliCount { get; set; }
        public int BasarisizCount { get; set; }
    }
}