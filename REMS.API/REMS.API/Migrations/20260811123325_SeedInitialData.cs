using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace REMS.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialData : Migration
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
                    { 2, "Düzce" }
                });

            migrationBuilder.InsertData(
                table: "Kullanicilar",
                columns: new[] { "Id", "AdSoyad", "AktifMi", "Email", "GuncellemeTarihi", "OlusturmaTarihi", "Rol", "SifreHash", "SifreSalt" },
                values: new object[] { new Guid("d28888e9-2ba9-473a-a40f-e38cb54f9b35"), "Sistem Yöneticisi", true, "admin@rems.com", null, new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Admin", "ornek_hash", "ornek_salt" });

            migrationBuilder.InsertData(
                table: "Ilceler",
                columns: new[] { "Id", "Ad", "IlId" },
                values: new object[,]
                {
                    { 1, "Çankaya", 1 },
                    { 2, "Yenimahalle", 1 },
                    { 3, "Merkez", 2 },
                    { 4, "Akçakoca", 2 }
                });

            migrationBuilder.InsertData(
                table: "Mahalleler",
                columns: new[] { "Id", "Ad", "IlceId" },
                values: new object[,]
                {
                    { 1, "Bahçelievler Mahallesi", 1 },
                    { 2, "Beştepe Mahallesi", 2 },
                    { 3, "Konuralp Mahallesi", 3 },
                    { 4, "Osmaniye Mahallesi", 4 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Kullanicilar",
                keyColumn: "Id",
                keyValue: new Guid("d28888e9-2ba9-473a-a40f-e38cb54f9b35"));

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
