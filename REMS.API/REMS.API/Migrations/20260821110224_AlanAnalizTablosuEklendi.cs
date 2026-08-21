using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace REMS.API.Migrations
{
    /// <inheritdoc />
    public partial class AlanAnalizTablosuEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlanAnalizGeometrileri",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    kullanici_id = table.Column<string>(type: "text", nullable: true),
                    etiket = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    alan_m2 = table.Column<decimal>(type: "numeric", nullable: true),
                    geometri = table.Column<Geometry>(type: "geometry", nullable: true),
                    olusturma_tarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlanAnalizGeometrileri", x => x.id);
                });

            migrationBuilder.UpdateData(
                table: "Kullanicilar",
                keyColumn: "Id",
                keyValue: new Guid("d28888e9-2ba9-473a-a40f-e38cb54f9b35"),
                columns: new[] { "SifreHash", "SifreSalt" },
                values: new object[] { "xGdPN49aJiC+vNCrJv+l5rWVse55J86Cvh2zr24NFDs=", "K8j9Lm2N4p6Q8r0T2v4X6z8B0d2F4h6J" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlanAnalizGeometrileri");

            migrationBuilder.UpdateData(
                table: "Kullanicilar",
                keyColumn: "Id",
                keyValue: new Guid("d28888e9-2ba9-473a-a40f-e38cb54f9b35"),
                columns: new[] { "SifreHash", "SifreSalt" },
                values: new object[] { "ornek_hash", "ornek_salt" });
        }
    }
}
