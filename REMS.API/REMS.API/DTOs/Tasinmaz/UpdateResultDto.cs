namespace REMS.API.DTOs.Tasinmaz
{
    public class UpdateResultDto
    {
        public bool Success { get; set; }
        public bool HasChanges { get; set; }
        public string DiffSummary { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}