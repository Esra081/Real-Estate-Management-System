import * as turf from '@turf/turf';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Text } from 'ol/style';
import { Tasinmaz } from '../../models/tasinmaz.model';

export interface KesisimBilgi {
  tasinmaz1: Tasinmaz;
  tasinmaz2: Tasinmaz;
  alanM2: number;
}

export interface KesisimSonucu {
  features: Feature<Polygon>[];
  count: number;
}

export class TasinmazSpatialHelper {

  // Poligonların ikili çakışmalarını Turf.js ile hesaplar
  static kesisimleriHesapla(tasinmazlar: Tasinmaz[]): KesisimSonucu {
    const features: Feature<Polygon>[] = [];
    let count = 0;

    const gecerliTasinmazlar = (tasinmazlar || []).filter(
      t => t.koordinatlar && t.koordinatlar.length >= 3
    );

    if (gecerliTasinmazlar.length < 2) {
      return { features: [], count: 0 };
    }

    for (let i = 0; i < gecerliTasinmazlar.length; i++) {
      for (let j = i + 1; j < gecerliTasinmazlar.length; j++) {
        const t1 = gecerliTasinmazlar[i];
        const t2 = gecerliTasinmazlar[j];

        try {
          const coords1 = t1.koordinatlar.map(c => [c[0], c[1]]);
          if (
            coords1[0][0] !== coords1[coords1.length - 1][0] ||
            coords1[0][1] !== coords1[coords1.length - 1][1]
          ) {
            coords1.push([coords1[0][0], coords1[0][1]]);
          }

          const coords2 = t2.koordinatlar.map(c => [c[0], c[1]]);
          if (
            coords2[0][0] !== coords2[coords2.length - 1][0] ||
            coords2[0][1] !== coords2[coords2.length - 1][1]
          ) {
            coords2.push([coords2[0][0], coords2[0][1]]);
          }

          const p1 = turf.polygon([coords1]);
          const p2 = turf.polygon([coords2]);

          const kesisim = turf.intersect(turf.featureCollection([p1, p2]));

          if (kesisim && kesisim.geometry) {
            const alanM2 = Math.round(turf.area(kesisim));
            if (alanM2 > 1) {
              count++;

              if (kesisim.geometry.type === 'Polygon') {
                const ring = kesisim.geometry.coordinates[0];
                const transformedCoords = ring.map((c: any) => fromLonLat([c[0], c[1]]));
                const poly = new Polygon([transformedCoords]);
                const feature = new Feature({
                  geometry: poly,
                  kesisimBilgi: {
                    tasinmaz1: t1,
                    tasinmaz2: t2,
                    alanM2
                  } as KesisimBilgi
                });
                features.push(feature);
              } else if (kesisim.geometry.type === 'MultiPolygon') {
                kesisim.geometry.coordinates.forEach((polyCoords: any) => {
                  const ring = polyCoords[0];
                  const transformedCoords = ring.map((c: any) => fromLonLat([c[0], c[1]]));
                  const poly = new Polygon([transformedCoords]);
                  const feature = new Feature({
                    geometry: poly,
                    kesisimBilgi: {
                      tasinmaz1: t1,
                      tasinmaz2: t2,
                      alanM2
                    } as KesisimBilgi
                  });
                  features.push(feature);
                });
              }
            }
          }
        } catch (hata) {
          console.warn('Kesişim hesaplanırken hata:', hata);
        }
      }
    }

    return { features, count };
  }

  // Çakışma bölgelerinin harita stili (kırmızı kesikli çizgi ve alan etiketi)
  static getKesisimStili(feature: any): Style {
    const bilgi = feature.get('kesisimBilgi') as KesisimBilgi | undefined;
    return new Style({
      fill: new Fill({
        color: 'rgba(239, 68, 68, 0.42)'
      }),
      stroke: new Stroke({
        color: '#dc2626',
        width: 2.5,
        lineDash: [6, 4]
      }),
      text: new Text({
        text: `⚠️ Çakışma (${bilgi?.alanM2 || 0} m²)`,
        font: 'bold 11px "Segoe UI", Roboto, sans-serif',
        fill: new Fill({ color: '#7f1d1d' }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
        overflow: true
      }),
      zIndex: 60
    });
  }
}
