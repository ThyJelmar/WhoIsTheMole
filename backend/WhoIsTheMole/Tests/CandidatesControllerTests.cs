using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WhoIsTheMole.API.Controllers;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Services;
using Xunit;

namespace WhoIsTheMole.Tests;

public class CandidatesControllerTests
{
    private static Mock<IFormFile> MakeFile(long length, string contentType, string fileName = "photo.jpg")
    {
        var mock = new Mock<IFormFile>();
        mock.Setup(f => f.Length).Returns(length);
        mock.Setup(f => f.ContentType).Returns(contentType);
        mock.Setup(f => f.FileName).Returns(fileName);
        return mock;
    }

    private static CandidatesController MakeController()
    {
        var serviceMock = new Mock<ICandidateService>();
        var envMock     = new Mock<IWebHostEnvironment>();
        envMock.Setup(e => e.WebRootPath).Returns(Path.GetTempPath());
        return new CandidatesController(serviceMock.Object, envMock.Object);
    }

    [Fact]
    public async Task UploadPhoto_ExceedsMaxSize_Returns400()
    {
        // Arrange
        var controller = MakeController();
        var file       = MakeFile(length: 3 * 1024 * 1024, contentType: "image/jpeg"); // 3 MB > 2 MB limit

        // Act
        var result = await controller.UploadPhoto(Guid.NewGuid(), file.Object);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UploadPhoto_InvalidContentType_Returns400()
    {
        // Arrange
        var controller = MakeController();
        var file       = MakeFile(length: 512 * 1024, contentType: "application/pdf", fileName: "doc.pdf");

        // Act
        var result = await controller.UploadPhoto(Guid.NewGuid(), file.Object);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UploadPhoto_NoFile_Returns400()
    {
        // Arrange
        var controller = MakeController();

        // Act
        var result = await controller.UploadPhoto(Guid.NewGuid(), null!);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UploadPhoto_ValidJpeg_PassesValidation()
    {
        // Arrange
        var serviceMock = new Mock<ICandidateService>();
        var envMock     = new Mock<IWebHostEnvironment>();
        var tempDir     = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        envMock.Setup(e => e.WebRootPath).Returns(tempDir);

        var id          = Guid.NewGuid();
        var photoUrl    = "/uploads/test.jpg";
        serviceMock.Setup(s => s.UpdatePhotoAsync(id, It.IsAny<string>()))
            .ReturnsAsync(new CandidateDto(id, Guid.NewGuid(), "Alice", photoUrl, null, true));

        var controller = new CandidatesController(serviceMock.Object, envMock.Object);

        var fileContent = new byte[] { 0xFF, 0xD8, 0xFF }; // JPEG magic bytes
        var fileMock    = new Mock<IFormFile>();
        fileMock.Setup(f => f.Length).Returns(fileContent.Length);
        fileMock.Setup(f => f.ContentType).Returns("image/jpeg");
        fileMock.Setup(f => f.FileName).Returns("photo.jpg");
        fileMock.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await controller.UploadPhoto(id, fileMock.Object);

        // Assert
        result.Should().BeOfType<OkObjectResult>();

        // Cleanup
        Directory.Delete(tempDir, recursive: true);
    }
}
