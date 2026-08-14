using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace REMS.API.Migrations
{
    /// <inheritdoc />
    public partial class LokasyonVerileriEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Iller",
                columns: new[] { "Id", "Ad" },
                values: new object[,]
                {
                    { 1, "Ankara" },
                    { 2, "İstanbul" }
                });

            migrationBuilder.InsertData(
                table: "Ilceler",
                columns: new[] { "Id", "Ad", "IlId" },
                values: new object[,]
                {
                    { 1, "Çankaya", 1 },
                    { 2, "Yenimahalle", 1 },
                    { 3, "Kadıköy", 2 },
                    { 4, "Beşiktaş", 2 }
                });

            migrationBuilder.InsertData(
                table: "Mahalleler",
                columns: new[] { "Id", "Ad", "IlceId" },
                values: new object[,]
                {
                    { 1, "Kavaklıdere Mahallesi", 1 },
                    { 2, "Bahçelievler Mahallesi", 1 },
                    { 3, "Batıkent Mahallesi", 2 },
                    { 4, "Caferağa Mahallesi", 3 },
                    { 5, "Moda Mahallesi", 3 },
                    { 6, "Bebek Mahallesi", 4 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Mahalleler",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Mahalleler",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Mahalleler",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Mahalleler",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Mahalleler",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Mahalleler",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Ilceler",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Ilceler",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Ilceler",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Ilceler",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Iller",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Iller",
                keyColumn: "Id",
                keyValue: 2);
        }
    }
}
