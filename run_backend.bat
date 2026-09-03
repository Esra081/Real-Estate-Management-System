@echo off
set ASPNETCORE_URLS=https://localhost:7195;http://localhost:5107
set ASPNETCORE_ENVIRONMENT=Development
cd /d C:\Users\Esra\Desktop\Esra\Projects\OdakGIS_Staj\REMS\REMS.API\REMS.API
dotnet run --launch-profile https
