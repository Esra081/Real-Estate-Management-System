namespace REMS.API.DTOs.Common
{
    public class PagedResponseDto<T>
    {
        public IEnumerable<T> Data { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }

    }
}