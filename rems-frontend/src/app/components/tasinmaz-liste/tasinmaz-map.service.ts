import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Icon, Text, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import ScaleLine from 'ol/control/ScaleLine';

import { Tasinmaz } from '../../models/tasinmaz.model';
import { getPinIconByTipi } from '../../shared/constants/map-icons';
import { TasinmazSpatialHelper, KesisimBilgi } from '../../shared/helpers/gis-spatial.helper';

@Injectable()
export class TasinmazMapService {

  private map?: Map;
  private vectorSource = new VectorSource<Feature<Polygon>>();
  private vectorLayer!: VectorLayer<VectorSource<Feature<Polygon>>>;

  private kesisimSource = new VectorSource<Feature<Polygon>>();
  private kesisimLayer!: VectorLayer<VectorSource<Feature<Polygon>>>;

  private pointSource = new VectorSource<Feature<Point>>();
  private clusterSource!: Cluster<Feature<Point>>;
  private clusterLayer!: VectorLayer<Cluster<Feature<Point>>>;

  private osmLayer!: TileLayer<OSM>;
  private uyduLayer!: TileLayer<XYZ>;
  private popupOverlay?: Overlay;

  private seciliTasinmaz: Tasinmaz | null = null;
  private currentTasinmazlar: Tasinmaz[] = [];

  // Bileşenin dinleyebileceği reaktif durumlar
  private readonly secilenTasinmazSubject = new BehaviorSubject<Tasinmaz | null>(null);
  readonly secilenTasinmaz$: Observable<Tasinmaz | null> = this.secilenTasinmazSubject.asObservable();

  private readonly secilenKesisimSubject = new BehaviorSubject<KesisimBilgi | null>(null);
  readonly secilenKesisim$: Observable<KesisimBilgi | null> = this.secilenKesisimSubject.asObservable();

  private readonly kumedekiTasinmazlarSubject = new BehaviorSubject<Tasinmaz[]>([]);
  readonly kumedekiTasinmazlar$: Observable<Tasinmaz[]> = this.kumedekiTasinmazlarSubject.asObservable();

  private readonly kesisimSayisiSubject = new BehaviorSubject<number>(0);
  readonly kesisimSayisi$: Observable<number> = this.kesisimSayisiSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  /**
   * Haritayı, altlık katmanlarını, kümeleme sistemini ve popup overlay'ini başlatır.
   */
  haritayiBaslat(targetId: string, popupElement?: HTMLElement | null): void {
    this.ngZone.runOutsideAngular(() => {
      // 1. Poligon katmanı
      this.vectorLayer = new VectorLayer({
        source: this.vectorSource,
        style: (feature) => this.getTasinmazStili(feature),
        opacity: 0.8,
        visible: true
      });

      // 2. Kesişim (çakışma) katmanı
      this.kesisimLayer = new VectorLayer({
        source: this.kesisimSource,
        style: (feature) => TasinmazSpatialHelper.getKesisimStili(feature),
        opacity: 0.8,
        visible: true,
        zIndex: 50
      });

      // 3. Nokta ve Kümeleme katmanı
      this.clusterSource = new Cluster({
        distance: 40,
        source: this.pointSource
      });

      this.clusterLayer = new VectorLayer({
        source: this.clusterSource,
        style: (feature) => this.getClusterStili(feature),
        zIndex: 100
      });

      // 4. Altlıklar
      this.osmLayer = new TileLayer({
        source: new OSM(),
        visible: true,
        opacity: 1.0
      });

      this.uyduLayer = new TileLayer({
        source: new XYZ({
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=tr',
          maxZoom: 20
        }),
        visible: false,
        opacity: 1.0
      });

      // 5. Harita Örneği
      this.map = new Map({
        target: targetId,
        layers: [
          this.osmLayer,
          this.uyduLayer,
          this.vectorLayer,
          this.kesisimLayer,
          this.clusterLayer
        ],
        view: new View({
          center: fromLonLat([32.85411, 39.92077]),
          zoom: 6
        })
      });

      // 6. Ölçek Çubuğu
      const olcekCubugu = new ScaleLine({
        units: 'metric',
        bar: false,
        minWidth: 85
      });
      this.map.addControl(olcekCubugu);

      // 7. Popup Overlay
      if (popupElement) {
        this.popupOverlay = new Overlay({
          element: popupElement,
          autoPan: {
            animation: {
              duration: 250
            }
          }
        });
        this.map.addOverlay(this.popupOverlay);
      }

      this.olaylariDinle();
    });
  }

  /**
   * Tıklama ve hover olaylarını bağlar
   */
  private olaylariDinle(): void {
    if (!this.map) return;

    this.map.on('singleclick', (evt) => {
      const feature = this.map!.forEachFeatureAtPixel(evt.pixel, (f) => f);

      if (!feature) {
        this.ngZone.run(() => this.popupKapat());
        return;
      }

      // 1. Kesişim poligonu tıklandıysa
      const kesisimBilgi = feature.get('kesisimBilgi') as KesisimBilgi | undefined;
      if (kesisimBilgi) {
        this.ngZone.run(() => {
          this.seciliTasinmaz = null;
          this.secilenTasinmazSubject.next(null);
          this.kumedekiTasinmazlarSubject.next([]);
          this.secilenKesisimSubject.next(kesisimBilgi);
          this.popupOverlay?.setPosition(evt.coordinate);
        });
        return;
      }

      // 2. Küme balonu veya tekil pin tıklandıysa
      const clusterFeatures = feature.get('features') as Feature<Point>[] | undefined;
      if (clusterFeatures && clusterFeatures.length > 0) {
        // A) Birden fazla taşınmaz tek kümedeyse
        if (clusterFeatures.length > 1) {
          const view = this.map!.getView();
          const currentZoom = view.getZoom() ?? 10;
          const firstCoord = (clusterFeatures[0].getGeometry() as Point).getCoordinates();

          // Hepsi aynı koordinatta (ör. aynı binada) mı kontrolü
          const hepsiAyniKonumda = clusterFeatures.every((f) => {
            const c = (f.getGeometry() as Point).getCoordinates();
            return Math.abs(c[0] - firstCoord[0]) < 1 && Math.abs(c[1] - firstCoord[1]) < 1;
          });

          if (hepsiAyniKonumda || currentZoom >= 18) {
            const list = clusterFeatures
              .map((f) => f.get('tasinmazBilgi') as Tasinmaz)
              .filter(Boolean);

            this.ngZone.run(() => {
              this.seciliTasinmaz = null;
              this.secilenTasinmazSubject.next(null);
              this.secilenKesisimSubject.next(null);
              this.kumedekiTasinmazlarSubject.next(list);
              this.popupOverlay?.setPosition(evt.coordinate);
            });
            return;
          } else {
            // Farklı binalar/noktalar ise yakınlaş
            view.animate({
              center: evt.coordinate,
              zoom: currentZoom + 2.5,
              duration: 400
            });
            return;
          }
        }

        // B) Tek bir taşınmaz pini tıklandıysa
        const tekTasinmaz = clusterFeatures[0].get('tasinmazBilgi') as Tasinmaz | undefined;
        if (tekTasinmaz) {
          this.ngZone.run(() => {
            this.seciliTasinmaz = tekTasinmaz;
            this.secilenTasinmazSubject.next(tekTasinmaz);
            this.secilenKesisimSubject.next(null);
            this.kumedekiTasinmazlarSubject.next([]);
            this.katmanlariYenile();
            this.popupOverlay?.setPosition(evt.coordinate);
          });
          return;
        }
      }

      // 3. Doğrudan Taşınmaz Poligonuna tıklandıysa
      const bilgi = feature.get('tasinmazBilgi') as Tasinmaz | undefined;
      if (bilgi) {
        this.ngZone.run(() => {
          this.seciliTasinmaz = bilgi;
          this.secilenTasinmazSubject.next(bilgi);
          this.secilenKesisimSubject.next(null);
          this.kumedekiTasinmazlarSubject.next([]);
          this.katmanlariYenile();

          const geom = feature.getGeometry();
          if (geom instanceof Polygon) {
            this.popupOverlay?.setPosition(geom.getInteriorPoint().getCoordinates());
          } else {
            this.popupOverlay?.setPosition(evt.coordinate);
          }
        });
        return;
      }

      this.ngZone.run(() => this.popupKapat());
    });

    this.map.on('pointermove', (evt) => {
      const hit = this.map!.hasFeatureAtPixel(evt.pixel);
      this.map!.getViewport().style.cursor = hit ? 'pointer' : '';
    });
  }

  /**
   * Haritadaki tüm taşınmaz poligonlarını, küme noktalarını ve çakışmaları çizer
   */
  tasinmazlariCiz(tasinmazlar: Tasinmaz[]): void {
    if (!this.map) return;

    this.currentTasinmazlar = tasinmazlar || [];
    this.vectorSource.clear();
    this.pointSource.clear();
    this.kesisimSource.clear();

    this.currentTasinmazlar.forEach((tasinmaz) => {
      if (tasinmaz.koordinatlar && tasinmaz.koordinatlar.length >= 3) {
        const donusturulmusKoordinatlar = tasinmaz.koordinatlar.map((k) =>
          fromLonLat([k[0], k[1]])
        );
        const poligon = new Polygon([donusturulmusKoordinatlar]);
        const feature = new Feature({
          geometry: poligon,
          tasinmazBilgi: tasinmaz
        });
        this.vectorSource.addFeature(feature);

        // Kümeleme için merkez noktası
        const merkez = poligon.getInteriorPoint().getCoordinates();
        const pointFeature = new Feature({
          geometry: new Point(merkez),
          tasinmazBilgi: tasinmaz
        });
        this.pointSource.addFeature(pointFeature);
      }
    });

    // Turf.js kesişim matematiğini helper ile hesapla ve çiz
    const kesimSonuc = TasinmazSpatialHelper.kesisimleriHesapla(this.currentTasinmazlar);
    this.kesisimSayisiSubject.next(kesimSonuc.count);
    if (kesimSonuc.features.length > 0) {
      this.kesisimSource.addFeatures(kesimSonuc.features);
    }
  }

  /**
   * Haritayı seçilen taşınmaza odaklar, poligonu vurgular ve popup açar
   */
  tasinmazaOdaklan(tasinmaz: Tasinmaz): void {
    if (!this.map || !tasinmaz.koordinatlar || tasinmaz.koordinatlar.length === 0) return;

    this.seciliTasinmaz = tasinmaz;
    this.secilenTasinmazSubject.next(tasinmaz);
    this.secilenKesisimSubject.next(null);
    this.kumedekiTasinmazlarSubject.next([]);

    const features = this.vectorSource.getFeatures();
    let hedefFeature = features.find((f) => f.get('tasinmazBilgi')?.id === tasinmaz.id);

    if (!hedefFeature) {
      const koordinatlar = tasinmaz.koordinatlar.map((k) => fromLonLat([k[0], k[1]]));
      const poligon = new Polygon([koordinatlar]);
      hedefFeature = new Feature({
        geometry: poligon,
        tasinmazBilgi: tasinmaz
      });
      this.vectorSource.addFeature(hedefFeature);
    }

    const geom = hedefFeature.getGeometry();
    if (geom) {
      this.map.getView().fit(geom.getExtent(), {
        padding: [90, 90, 90, 90],
        duration: 600,
        maxZoom: 17
      });

      if (geom instanceof Polygon && this.popupOverlay) {
        const center = geom.getInteriorPoint().getCoordinates();
        this.popupOverlay.setPosition(center);
      }
    }

    this.katmanlariYenile();
  }

  /**
   * Aynı binadaki taşınmazlar popup'ından bir mülk seçildiğinde çağrılır
   */
  kumedekiTasinmaziSec(t: Tasinmaz): void {
    this.seciliTasinmaz = t;
    this.secilenTasinmazSubject.next(t);
    this.kumedekiTasinmazlarSubject.next([]);
    this.katmanlariYenile();
  }

  /**
   * Popup'ı ve aktif seçimleri kapatır
   */
  popupKapat(): void {
    this.popupOverlay?.setPosition(undefined);
    this.seciliTasinmaz = null;
    this.secilenTasinmazSubject.next(null);
    this.secilenKesisimSubject.next(null);
    this.kumedekiTasinmazlarSubject.next([]);
    this.katmanlariYenile();
  }

  /**
   * Altlık harita değiştirme (OSM vs Google Maps Uydu)
   */
  altlikDegistir(tip: 'standart' | 'uydu'): void {
    if (this.osmLayer && this.uyduLayer) {
      this.osmLayer.setVisible(tip === 'standart');
      this.uyduLayer.setVisible(tip === 'uydu');
    }
  }

  /**
   * Altlık harita opaklığı ayarı (0-100)
   */
  setAltlikOpaklik(yuzde: number): void {
    const opaklik = Math.max(0, Math.min(100, yuzde)) / 100;
    this.osmLayer?.setOpacity(opaklik);
    this.uyduLayer?.setOpacity(opaklik);
  }

  /**
   * Taşınmaz vektör katmanları opaklığı ayarı (0-100)
   */
  setTasinmazOpaklik(yuzde: number): void {
    const opaklik = Math.max(0, Math.min(100, yuzde)) / 100;
    if (this.vectorLayer) {
      this.vectorLayer.setOpacity(opaklik);
      this.vectorLayer.setVisible(opaklik > 0);
    }
    if (this.kesisimLayer) {
      this.kesisimLayer.setOpacity(opaklik);
      this.kesisimLayer.setVisible(opaklik > 0);
    }
  }

  /**
   * Seçim değiştiğinde vektör ve cluster stillerini yeniler
   */
  private katmanlariYenile(): void {
    this.vectorLayer?.changed();
    this.clusterLayer?.changed();
  }

  /**
   * Taşınmaz poligon stili
   */
  private getTasinmazStili(feature: any): Style[] {
    const tasinmaz: Tasinmaz = feature.get('tasinmazBilgi');
    const isSelected = !!this.seciliTasinmaz && this.seciliTasinmaz.id === tasinmaz?.id;
    const zoom = this.map?.getView() ? (this.map.getView().getZoom() ?? 10) : 10;
    const tip = (tasinmaz?.tasinmazTipi || '').trim().toLowerCase();

    let strokeColor = '#1e3a8a';
    let fillColor = 'rgba(37, 99, 235, 1.0)';

    if (tip === 'arsa') {
      strokeColor = '#14532d';
      fillColor = 'rgba(22, 163, 74, 1.0)';
    } else if (tip === 'bina') {
      strokeColor = '#7c2d12';
      fillColor = 'rgba(234, 88, 12, 1.0)';
    } else if (tip !== 'konut') {
      strokeColor = '#0f172a';
      fillColor = 'rgba(100, 116, 139, 1.0)';
    }

    if (isSelected) {
      strokeColor = '#78350f';
      fillColor = 'rgba(217, 119, 6, 1.0)';
    }

    return [
      new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({
          color: strokeColor,
          width: isSelected ? 4.5 : (zoom >= 14 ? 3.2 : 2.5)
        }),
        zIndex: isSelected ? 100 : 10
      })
    ];
  }

  /**
   * Kümeleme ve tekil pin stili
   */
  private getClusterStili(feature: any): Style | Style[] {
    const features = feature.get('features') || [];
    const count = features.length;

    if (count === 0) return [];

    // 1. Birden fazla taşınmaz -> Küme Balonu
    if (count > 1) {
      const radius = count < 10 ? 17 : count < 50 ? 21 : 25;
      return new Style({
        image: new CircleStyle({
          radius: radius,
          fill: new Fill({ color: 'rgba(30, 36, 26, 0.90)' }),
          stroke: new Stroke({ color: '#C6F051', width: 2.5 })
        }),
        text: new Text({
          text: count.toString(),
          fill: new Fill({ color: '#FFFFFF' }),
          font: 'bold 12px "Segoe UI", sans-serif',
          offsetY: 1
        }),
        zIndex: 150
      });
    }

    // 2. Tek taşınmaz -> Pin İkonu
    const originalFeature = features[0];
    const tasinmaz: Tasinmaz = originalFeature.get('tasinmazBilgi');
    if (!tasinmaz) return [];

    const isSelected = !!this.seciliTasinmaz && this.seciliTasinmaz.id === tasinmaz.id;
    const zoom = this.map?.getView() ? (this.map.getView().getZoom() ?? 10) : 10;
    const iconSrc = getPinIconByTipi(tasinmaz.tasinmazTipi);

    let pinScale = zoom >= 15 ? 1.0 : (zoom >= 12 ? 0.92 : 0.85);
    if (isSelected) pinScale *= 1.15;

    let textStyle: Text | undefined = undefined;
    if (zoom >= 14.5) {
      textStyle = new Text({
        text: `Ada: ${tasinmaz.adaNo} / Parsel: ${tasinmaz.parselNo}`,
        font: 'bold 11px "Segoe UI", Roboto, sans-serif',
        fill: new Fill({ color: isSelected ? '#b45309' : '#0f172a' }),
        stroke: new Stroke({ color: '#ffffff', width: 3.5 }),
        offsetY: 24,
        overflow: true
      });
    }

    return new Style({
      image: new Icon({
        src: iconSrc,
        anchor: [0.5, 43 / 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: pinScale
      }),
      text: textStyle,
      zIndex: isSelected ? 120 : 100
    });
  }

  /**
   * Component unmount olduğunda kaynakları temizler
   */
  destroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = undefined;
    }
  }
}
