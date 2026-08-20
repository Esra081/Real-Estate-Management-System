using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace REMS.API.Migrations
{
    /// <inheritdoc />
    public partial class LogTablosuEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Loglar",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    kullanici_id = table.Column<string>(type: "text", nullable: true),
                    kullanici_email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    islem_tipi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    aciklama = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    durum = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ip_adresi = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    tarih = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Loglar", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tasinmazlar_mahalle_id",
                table: "Tasinmazlar",
                column: "mahalle_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasinmazlar_Mahalleler_mahalle_id",
                table: "Tasinmazlar",
                column: "mahalle_id",
                principalTable: "Mahalleler",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasinmazlar_Mahalleler_mahalle_id",
                table: "Tasinmazlar");

            migrationBuilder.DropTable(
                name: "Loglar");

            migrationBuilder.DropIndex(
                name: "IX_Tasinmazlar_mahalle_id",
                table: "Tasinmazlar");
        }
    }
}
