using NetTopologySuite;
using NetTopologySuite.Geometries;
using System;
using System.Collections.Generic;
using System.Linq;

namespace REMS.API.Helpers
{
    public static class GeometryHelper
    {
        private static readonly GeometryFactory _geometryFactory =
            NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

        // 1. Koordinat Listesinden (Frontend formatı) NTS Poligonu Üretir
        public static Polygon KoordinatlardanPoligonUret(IEnumerable<double[]> koordinatListesi)
        {
            var coordinates = koordinatListesi.Select(k => new Coordinate(k[0], k[1])).ToList();

            if (coordinates.Count < 3)
                throw new ArgumentException("Bir poligon için en az 3 nokta gereklidir.");

            // Poligonun başı ve sonu birleşmeli (Halka kapanmalı)
            if (!coordinates.First().Equals2D(coordinates.Last()))
            {
                coordinates.Add(coordinates.First());
            }

            var ring = _geometryFactory.CreateLinearRing(coordinates.ToArray());
            return _geometryFactory.CreatePolygon(ring);
        }

        // List<List<double>> desteği için aşırı yükleme (Overload)
        public static Polygon KoordinatlardanPoligonUret(List<List<double>> koordinatListesi)
        {
            return KoordinatlardanPoligonUret(koordinatListesi.Select(k => new double[] { k[0], k[1] }));
        }

        // 2. Geometriden (Polygon / MultiPolygon) Koordinat Dizisini Çıkarır (List<List<double>>)
        public static List<List<double>> PoligondanKoordinatlariAl(Geometry? geometri)
        {
            var sonuc = new List<List<double>>();
            if (geometri == null || geometri.IsEmpty) return sonuc;

            Polygon? poly = geometri as Polygon;
            if (poly == null && geometri is MultiPolygon multi && multi.Count > 0)
            {
                // MultiPolygon ise en büyük parçayı alırız
                poly = multi.Geometries.OfType<Polygon>().OrderByDescending(p => p.Area).FirstOrDefault();
            }

            if (poly?.ExteriorRing != null)
            {
                foreach (var coordinate in poly.ExteriorRing.Coordinates)
                {
                    sonuc.Add(new List<double> { coordinate.X, coordinate.Y });
                }
            }

            return sonuc;
        }

        // 2b. Geometriden List<double[]> formatında koordinat çıkarır (Tasinmaz modelleri için)
        public static List<double[]> PoligondanDiziKoordinatAl(Geometry? geometri)
        {
            var sonuc = new List<double[]>();
            if (geometri == null || geometri.IsEmpty) return sonuc;

            Polygon? poly = geometri as Polygon;
            if (poly == null && geometri is MultiPolygon multi && multi.Count > 0)
            {
                poly = multi.Geometries.OfType<Polygon>().OrderByDescending(p => p.Area).FirstOrDefault();
            }

            if (poly?.ExteriorRing != null)
            {
                foreach (var coordinate in poly.ExteriorRing.Coordinates)
                {
                    sonuc.Add(new double[] { coordinate.X, coordinate.Y });
                }
            }

            return sonuc;
        }

        // 3. WGS84 Derece Koordinatlarından Gerçek Yüzey Alanını (m²) Hesaplar
        public static decimal HesaplaM2(Geometry? geometri)
        {
            if (geometri == null || geometri.IsEmpty) return 0;

            if (geometri is Polygon poly)
            {
                return (decimal)HesaplaHalkaAlani(poly.ExteriorRing);
            }
            else if (geometri is MultiPolygon multi)
            {
                double toplamAlan = 0;
                foreach (var g in multi.Geometries.OfType<Polygon>())
                {
                    toplamAlan += HesaplaHalkaAlani(g.ExteriorRing);
                }
                return (decimal)toplamAlan;
            }

            return 0;
        }

        // Küresel Geodesic Alan Hesabı (WGS84 Küresi)
        private static double HesaplaHalkaAlani(LineString ring)
        {
            var coords = ring.Coordinates;
            if (coords.Length < 3) return 0;

            double radius = 6378137.0; // Dünya yarıçapı (metre)
            double total = 0;

            for (int i = 0; i < coords.Length - 1; i++)
            {
                var p1 = coords[i];
                var p2 = coords[i + 1];

                double lon1Rad = p1.X * (Math.PI / 180.0);
                double lat1Rad = p1.Y * (Math.PI / 180.0);
                double lon2Rad = p2.X * (Math.PI / 180.0);
                double lat2Rad = p2.Y * (Math.PI / 180.0);

                total += (lon2Rad - lon1Rad) * (2 + Math.Sin(lat1Rad) + Math.Sin(lat2Rad));
            }

            total = Math.Abs(total * radius * radius / 2.0);
            return Math.Round(total, 2);
        }
    }
}