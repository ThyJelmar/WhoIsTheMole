using WhoIsTheMole.Application.DTOs;

namespace WhoIsTheMole.Application.Services;

public interface ICandidateService
{
    Task<List<CandidateDto>> GetBySeasonAsync(Guid seasonId);
    Task<CandidateDto?> GetByIdAsync(Guid id);
    Task<CandidateDto> CreateAsync(Guid seasonId, CreateCandidateRequest request);
    Task<CandidateDto> UpdateAsync(Guid id, UpdateCandidateRequest request);
    Task DeleteAsync(Guid id);
    Task<CandidateDto> UpdatePhotoAsync(Guid id, string photoUrl);
}
