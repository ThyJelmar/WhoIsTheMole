using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Exceptions;
using WhoIsTheMole.Application.Services;
using WhoIsTheMole.Domain.Entities;
using WhoIsTheMole.Infrastructure.Data;
using Xunit;

namespace WhoIsTheMole.Tests;

public class SeasonServiceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SetActive_DeactivatesAllOtherSeasons()
    {
        // Arrange
        await using var db = CreateContext();
        var season1 = new Season { Id = Guid.NewGuid(), Name = "Season 1", Year = 2023, IsActive = true };
        var season2 = new Season { Id = Guid.NewGuid(), Name = "Season 2", Year = 2024, IsActive = false };
        db.Seasons.AddRange(season1, season2);
        await db.SaveChangesAsync();

        var service = new SeasonService(db);

        // Act
        await service.SetActiveAsync(season2.Id);

        // Assert
        var seasons = await db.Seasons.ToListAsync();
        seasons.Single(s => s.Id == season2.Id).IsActive.Should().BeTrue();
        seasons.Single(s => s.Id == season1.Id).IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task SetActive_WhenMultipleSeasonsActive_DeactivatesAll()
    {
        // Arrange
        await using var db = CreateContext();
        var season1 = new Season { Id = Guid.NewGuid(), Name = "Season 1", Year = 2022, IsActive = true };
        var season2 = new Season { Id = Guid.NewGuid(), Name = "Season 2", Year = 2023, IsActive = true };
        var season3 = new Season { Id = Guid.NewGuid(), Name = "Season 3", Year = 2024, IsActive = false };
        db.Seasons.AddRange(season1, season2, season3);
        await db.SaveChangesAsync();

        var service = new SeasonService(db);

        // Act
        await service.SetActiveAsync(season3.Id);

        // Assert
        var seasons = await db.Seasons.ToListAsync();
        seasons.Single(s => s.Id == season3.Id).IsActive.Should().BeTrue();
        seasons.Where(s => s.Id != season3.Id).Should().AllSatisfy(s => s.IsActive.Should().BeFalse());
    }

    [Fact]
    public async Task Delete_ActiveSeason_ThrowsInvalidOperationException()
    {
        // Arrange
        await using var db = CreateContext();
        var season = new Season { Id = Guid.NewGuid(), Name = "Active Season", Year = 2024, IsActive = true };
        db.Seasons.Add(season);
        await db.SaveChangesAsync();

        var service = new SeasonService(db);

        // Act
        var act = () => service.DeleteAsync(season.Id);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*active season*");
    }

    [Fact]
    public async Task Delete_InactiveSeason_Succeeds()
    {
        // Arrange
        await using var db = CreateContext();
        var season = new Season { Id = Guid.NewGuid(), Name = "Old Season", Year = 2020, IsActive = false };
        db.Seasons.Add(season);
        await db.SaveChangesAsync();

        var service = new SeasonService(db);

        // Act
        await service.DeleteAsync(season.Id);

        // Assert
        var count = await db.Seasons.CountAsync();
        count.Should().Be(0);
    }

    [Fact]
    public async Task Delete_NonExistentSeason_ThrowsNotFoundException()
    {
        // Arrange
        await using var db = CreateContext();
        var service = new SeasonService(db);

        // Act
        var act = () => service.DeleteAsync(Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Create_WhenIsActiveTrue_DeactivatesExistingActiveSeason()
    {
        // Arrange
        await using var db = CreateContext();
        var existing = new Season { Id = Guid.NewGuid(), Name = "Old Active", Year = 2023, IsActive = true };
        db.Seasons.Add(existing);
        await db.SaveChangesAsync();

        var service = new SeasonService(db);

        // Act
        var result = await service.CreateAsync(new CreateSeasonRequest("New Season", 2024, IsActive: true));

        // Assert
        result.IsActive.Should().BeTrue();
        var oldSeason = await db.Seasons.FindAsync(existing.Id);
        oldSeason!.IsActive.Should().BeFalse();
    }
}
