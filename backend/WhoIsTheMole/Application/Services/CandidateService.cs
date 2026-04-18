using Microsoft.EntityFrameworkCore;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Exceptions;
using WhoIsTheMole.Domain.Entities;
using WhoIsTheMole.Infrastructure.Data;

namespace WhoIsTheMole.Application.Services;

public class CandidateService(AppDbContext db) : ICandidateService
{
    public async Task<List<CandidateDto>> GetBySeasonAsync(Guid seasonId)
    {
        return await db.Candidates
            .Where(c => c.SeasonId == seasonId)
            .OrderBy(c => c.Name)
            .Select(c => new CandidateDto(c.Id, c.SeasonId, c.Name, c.PhotoUrl, c.Description, c.IsActive))
            .ToListAsync();
    }

    public async Task<CandidateDto?> GetByIdAsync(Guid id)
    {
        var c = await db.Candidates.FindAsync(id);
        return c is null ? null : new CandidateDto(c.Id, c.SeasonId, c.Name, c.PhotoUrl, c.Description, c.IsActive);
    }

    public async Task<CandidateDto> CreateAsync(Guid seasonId, CreateCandidateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Candidate name is required.");

        if (!await db.Seasons.AnyAsync(s => s.Id == seasonId))
            throw new NotFoundException("Season not found.");

        var candidate = new Candidate
        {
            Id          = Guid.NewGuid(),
            SeasonId    = seasonId,
            Name        = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive    = true,
        };

        db.Candidates.Add(candidate);
        await db.SaveChangesAsync();

        return new CandidateDto(
            candidate.Id, candidate.SeasonId, candidate.Name,
            candidate.PhotoUrl, candidate.Description, candidate.IsActive);
    }

    public async Task<CandidateDto> UpdateAsync(Guid id, UpdateCandidateRequest request)
    {
        var candidate = await db.Candidates.FindAsync(id)
            ?? throw new NotFoundException("Candidate not found.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Candidate name is required.");

        candidate.Name        = request.Name.Trim();
        candidate.Description = request.Description?.Trim();
        await db.SaveChangesAsync();

        return new CandidateDto(
            candidate.Id, candidate.SeasonId, candidate.Name,
            candidate.PhotoUrl, candidate.Description, candidate.IsActive);
    }

    public async Task DeleteAsync(Guid id)
    {
        var candidate = await db.Candidates.FindAsync(id)
            ?? throw new NotFoundException("Candidate not found.");

        db.Candidates.Remove(candidate);
        await db.SaveChangesAsync();
    }

    public async Task<CandidateDto> UpdatePhotoAsync(Guid id, string photoUrl)
    {
        var candidate = await db.Candidates.FindAsync(id)
            ?? throw new NotFoundException("Candidate not found.");

        candidate.PhotoUrl = photoUrl;
        await db.SaveChangesAsync();

        return new CandidateDto(
            candidate.Id, candidate.SeasonId, candidate.Name,
            candidate.PhotoUrl, candidate.Description, candidate.IsActive);
    }
}
