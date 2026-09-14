using AutoMapper;
using REMS.API.DTOs;
using REMS.API.DTOs.Il;
using REMS.API.DTOs.Ilce;
using REMS.API.DTOs.Kullanici;
using REMS.API.DTOs.Log;
using REMS.API.DTOs.Mahalle;
using REMS.API.DTOs.Property;
using REMS.API.DTOs.Tasinmaz;
using REMS.API.Entities;
using REMS.API.Helpers;
using REMS.API.DTOs.AlanAnalizi;

namespace REMS.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Tasinmaz, TasinmazListDto>()
                .ForMember(dest => dest.IlAdi, opt => opt.MapFrom(src => src.Mahalle != null && src.Mahalle.Ilce != null && src.Mahalle.Ilce.Il != null ? src.Mahalle.Ilce.Il.Ad : ""))
                .ForMember(dest => dest.IlceAdi, opt => opt.MapFrom(src => src.Mahalle != null && src.Mahalle.Ilce != null ? src.Mahalle.Ilce.Ad : ""))
                .ForMember(dest => dest.MahalleAdi, opt => opt.MapFrom(src => src.Mahalle != null ? src.Mahalle.Ad : ""))
                .ForMember(dest => dest.Koordinatlar, opt => opt.MapFrom(src => GeometryHelper.PoligondanDiziKoordinatAl(src.Sinir)))
                .ForMember(dest => dest.KullaniciAdi, opt => opt.Ignore());

            CreateMap<TasinmazCreateDto, Tasinmaz>()
                .ForMember(dest => dest.Sinir, opt => opt.MapFrom(src => GeometryHelper.KoordinatlardanPoligonUret(src.Koordinatlar)))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Mahalle, opt => opt.Ignore());

            CreateMap<Kullanici, KullaniciListDto>()
                .ForMember(dest => dest.TasinmazSayisi, opt => opt.Ignore());

            CreateMap<KullaniciCreateDto, Kullanici>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.Trim().ToLower()))
                .ForMember(dest => dest.AdSoyad, opt => opt.MapFrom(src => src.AdSoyad.Trim()))
                .ForMember(dest => dest.Rol, opt => opt.MapFrom(src => string.IsNullOrWhiteSpace(src.Rol) ? "Kullanici" : src.Rol))
                .ForMember(dest => dest.AktifMi, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.OlusturmaTarihi, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.SifreHash, opt => opt.Ignore())
                .ForMember(dest => dest.SifreSalt, opt => opt.Ignore());
            CreateMap<KullaniciUpdateDto, Kullanici>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.Trim().ToLower()))
                .ForMember(dest => dest.AdSoyad, opt => opt.MapFrom(src => src.AdSoyad.Trim()))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OlusturmaTarihi, opt => opt.Ignore())
                .ForMember(dest => dest.SifreHash, opt => opt.Ignore())
                .ForMember(dest => dest.SifreSalt, opt => opt.Ignore());

            CreateMap<Log, LogListDto>()
                .ForMember(dest => dest.KullaniciAdi, opt => opt.Ignore());

            CreateMap<Il, IlListDto>();
            CreateMap<Ilce, IlceListDto>();
            CreateMap<Mahalle, MahalleListDto>();

            CreateMap<RegisterDto, Kullanici>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.Trim().ToLower()))
                .ForMember(dest => dest.AdSoyad, opt => opt.MapFrom(src => src.AdSoyad.Trim()))
                .ForMember(dest => dest.Rol, opt => opt.MapFrom(src => "Kullanici"))
                .ForMember(dest => dest.AktifMi, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.OlusturmaTarihi, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.SifreHash, opt => opt.Ignore())
                .ForMember(dest => dest.SifreSalt, opt => opt.Ignore());

            CreateMap<TasinmazUpdateDto, Tasinmaz>()
                .ForMember(dest => dest.AdaNo, opt => opt.MapFrom(src => src.AdaNo != null ? src.AdaNo.Trim() : null))
                .ForMember(dest => dest.ParselNo, opt => opt.MapFrom(src => src.ParselNo != null ? src.ParselNo.Trim() : null))
                .ForMember(dest => dest.Adres, opt => opt.MapFrom(src => src.Adres != null ? src.Adres.Trim() : null))
                .ForMember(dest => dest.TasinmazTipi, opt => opt.MapFrom(src => src.TasinmazTipi != null ? src.TasinmazTipi.Trim() : null))
                .ForMember(dest => dest.ResimUrl, opt => opt.MapFrom(src => string.IsNullOrWhiteSpace(src.ResimUrl) ? null : src.ResimUrl.Trim()))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.Sinir, opt => opt.Ignore())
                .ForMember(dest => dest.Mahalle, opt => opt.Ignore());

            CreateMap<AlanAnalizGeometri, PoligonDto>()
                .ForMember(dest => dest.AlanM2, opt => opt.MapFrom(src => src.AlanM2 ?? GeometryHelper.HesaplaM2(src.Geometri)))
                .ForMember(dest => dest.Koordinatlar, opt => opt.MapFrom(src => GeometryHelper.PoligondanKoordinatlariAl(src.Geometri)));

            CreateMap<PoligonDto, AlanAnalizGeometri>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.KullaniciId, opt => opt.Ignore())
                .ForMember(dest => dest.Geometri, opt => opt.Ignore())
                .ForMember(dest => dest.OlusturmaTarihi, opt => opt.Ignore());
        }
    }
}


