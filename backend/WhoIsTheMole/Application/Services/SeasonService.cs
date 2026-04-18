using Microsoft.EntityFrameworkCore;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Exceptions;
using WhoIsTheMole.Domain.Entities;
using WhoIsTheMole.Infrastructure.Data;

namespace WhoIsTheMole.Application.Services;

public class SeasonService(AppDbContext db) : ISeasonService
{
    public async Task<List<SeasonDto>> GetAllAsync()
    {
        return await db.Seasons
            .OrderByDescending(s => s.Year)
            .ThenBy(s => s.Name)
            .Select(s => new SeasonDto(
                s.Id,
                s.Name,
                s.Year,
                s.IsActive,
                s.Candidates.Count,
                s.Episodes.Count))
            .ToListAsync();
    }

    public async Task<SeasonDto?> GetByIdAsync(Guid id)
    {
        return await db.Seasons
            .Where(s => s.Id == id)
            .Select(s => new SeasonDto(
                s.Id,
                s.Name,
                s.Year,
                s.IsActive,
                s.Candidates.Count,
                s.Episodes.Count))
            .FirstOrDefaultAsync();
    }

    public async Task<SeasonDto?> GetActiveAsync()
    {
        return await db.Seasons
            .Where(s => s.IsActive)
            .Select(s => new SeasonDto(
                s.Id,
                s.Name,
                s.Year,
                s.IsActive,
                s.Candidates.Count,
                s.Episodes.Count))
            .FirstOrDefaultAsync();
    }

    public async Task<SeasonDto> CreateAsync(CreateSeasonRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Season name is required.");

        if (request.Year < 2000 || request.Year > 2099)
            throw new BadRequestException("Year must be between 2000 and 2099.");

        if (request.IsActive)
        {
            var active = await db.Seasons.Where(s => s.IsActive).ToListAsync();
            foreach (var s in active) s.IsActive = false;
        }

        var season = new Season
        {
            Id       = Guid.NewGuid(),
            Name     = request.Name.Trim(),
            Year     = request.Year,
            IsActive = request.IsActive,
        };

        db.Seasons.Add(season);
        await db.SaveChangesAsync();

        return new SeasonDto(season.Id, season.Name, season.Year, season.IsActive, 0, 0);
    }

    public async Task<SeasonDto> UpdateAsync(Guid id, UpdateSeasonRequest request)
    {
        var season = await db.Seasons.FindAsync(id)
            ?? throw new NotFoundException("Season not found.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Season name is required.");

        if (request.Year < 2000 || request.Year > 2099)
            throw new BadRequestException("Year must be between 2000 and 2099.");

        if (request.IsActive && !season.IsActive)
        {
            var active = await db.Seasons.Where(s => s.IsActive && s.Id != id).ToListAsync();
            foreach (var s in active) s.IsActive = false;
        }

        season.Name     = request.Name.Trim();
        season.Year     = request.Year;
        season.IsActive = request.IsActive;
        await db.SaveChangesAsync();

        var candidateCount = await db.Candidates.CountAsync(c => c.SeasonId == id);
        var episodeCount   = await db.Episodes.CountAsync(e => e.SeasonId == id);

        return new SeasonDto(season.Id, season.Name, season.Year, season.IsActive, candidateCount, episodeCount);
    }

    public async Task DeleteAsync(Guid id)
    {
        var season = await db.Seasons.FindAsync(id)
            ?? throw new NotFoundException("Season not found.");

        if (season.IsActive)
            throw new InvalidOperationException(
                "Cannot delete the active season. Set another season as active first.");

        db.Seasons.Remove(season);
        await db.SaveChangesAsync();
    }

    public async Task SetActiveAsync(Guid id)
    {
        var target = await db.Seasons.FindAsync(id)
            ?? throw new NotFoundException("Season not found.");

        await using var tx = await db.Database.BeginTransactionAsync();
        try
        {
            var active = await db.Seasons.Where(s => s.IsActive).ToListAsync();
            foreach (var s in active) s.IsActive = false;

            target.IsActive = true;
            await db.SaveChangesAsync();
            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
