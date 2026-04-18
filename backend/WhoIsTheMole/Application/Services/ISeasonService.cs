using WhoIsTheMole.Application.DTOs;

namespace WhoIsTheMole.Application.Services;

public interface ISeasonService
{
    Task<List<SeasonDto>> GetAllAsync();
    Task<SeasonDto?> GetByIdAsync(Guid id);
    Task<SeasonDto?> GetActiveAsync();
    Task<SeasonDto> CreateAsync(CreateSeasonRequest request);
    Task<SeasonDto> UpdateAsync(Guid id, UpdateSeasonRequest request);
    Task DeleteAsync(Guid id);
    Task SetActiveAsync(Guid id);
}
