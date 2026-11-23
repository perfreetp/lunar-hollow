/**
 * MapLibre chart basemap.
 *
 * Deliberately tile-free: the depth image, isobaths, coastline and graticule
 * are generated from the chart model and added as local sources. That keeps the
 * tool fully offline and makes the chart data the single source of truth for
 * both the basemap and the light model.
 *
 * Labels are drawn in the DOM overlay (see chart-labels.ts), not in glyph
 * symbol layers, so no font endpoint is required.
 */
import maplibregl, {
  type Map as MlMap,
  type StyleSpecification,
  type GeoJSONSource,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LngLat } from '../core/geo.ts';
import { chaikin } from '../core/polygon.ts';
import type { ChartData } from '../model/types.ts';
import type { DepthModel } from '../model/depth-field.ts';
import { CHART_BOUNDS } from '../model/chart-data.ts';
import { buildDepthImage, chartGridLines, PALETTES, type Theme } from './chart-raster.ts';

export interface ChartMapOptions {
  container: HTMLElement;
  chart: ChartData;
  depth: DepthModel;
  theme: Theme;
}

export interface ChartMapHandle {
  map: MlMap;
  setTheme(theme: Theme): Promise<void>;
  focus(points: LngLat[], padding?: number): void;
  project(p: LngLat): { x: number; y: number };
  unproject(x: number, y: number): LngLat;
  setRoute(points: LngLat[]): void;
  destroy(): void;
}

const GRATICULE_STEP = 0.02;

type ImageCoordinates = [[number, number], [number, number], [number, number], [number, number]];

function landFeatures(chart: ChartData): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: chart.land.map((ring, i) => ({
      type: 'Feature',
      id: i,
      properties: { ring: i },
      geometry: {
        type: 'Polygon',
        coordinates: [[...ring.map((p) => [p.lng, p.lat]), [ring[0].lng, ring[0].lat]]],
      },
    })),
  };
}

function shoreFeatures(chart: ChartData): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: chart.land.map((ring, i) => {
      const smooth = ring.length > 14 ? chaikin(ring, 2, true) : ring;
      return {
        type: 'Feature' as const,
        id: i,
        properties: { ring: i },
        geometry: {
          type: 'LineString' as const,
          coordinates: [...smooth.map((p) => [p.lng, p.lat]), [smooth[0].lng, smooth[0].lat]],
        },
      };
    }),
  };
}

function isobathFeatures(depth: DepthModel): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: depth.contours.map((line, i) => ({
      type: 'Feature',
      id: i,
      properties: {
        level: line.level,
        major: line.level === 5 || line.level === 10 || line.level === 20 ? 1 : 0,
      },
      geometry: { type: 'LineString', coordinates: line.coordinates.map((p) => [p.lng, p.lat]) },
    })),
  };
}

function graticuleFeatures(): GeoJSON.FeatureCollection {
  const lines = chartGridLines(CHART_BOUNDS, GRATICULE_STEP);
  const features: GeoJSON.Feature[] = [];
  let idx = 0;
  for (const l of lines) {
    const isMeridian = Math.abs(l.start.lng - l.end.lng) < 1e-9;
    const value = isMeridian ? l.start.lng : l.start.lat;
    const stepValue = Math.round(value / GRATICULE_STEP);
    features.push({
      type: 'Feature',
      id: idx++,
      properties: { major: stepValue % 5 === 0 ? 1 : 0 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [l.start.lng, l.start.lat],
          [l.end.lng, l.end.lat],
        ],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function rasterUrl(image: { data: Uint8ClampedArray; width: number; height: number }): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  const imgData = ctx.createImageData(image.width, image.height);
  imgData.data.set(image.data);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

export async function createChartMap(opts: ChartMapOptions): Promise<ChartMapHandle> {
  const { chart, depth, theme } = opts;
  const initial = await buildDepthImage(depth.grid, theme);
  const initialUrl = rasterUrl(initial);
  const style: StyleSpecification = {
    version: 8,
    name: `chisha-${theme}`,
    sources: {
      depth: { type: 'image', url: initialUrl, coordinates: initial.coordinates as ImageCoordinates },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': `rgb(${PALETTES[theme].seaDeep.join(',')})` },
      },
    ],
  };

  const map = new maplibregl.Map({
    container: opts.container,
    style,
    bounds: [
      [CHART_BOUNDS.west - 0.006, CHART_BOUNDS.south - 0.003],
      [CHART_BOUNDS.east + 0.006, CHART_BOUNDS.north + 0.003],
    ],
    fitBoundsOptions: { padding: 6 },
    attributionControl: false,
    maxZoom: 17.2,
    minZoom: 10.02,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    renderWorldCopies: false,
    fadeDuration: 0,
    refreshExpiredTiles: false,
    maxBounds: [
      [CHART_BOUNDS.west - 0.02, CHART_BOUNDS.south - 0.012],
      [CHART_BOUNDS.east + 0.02, CHART_BOUNDS.north + 0.012],
    ],
  });

  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.doubleClickZoom.disable();

  await new Promise<void>((resolve, reject) => {
    map.once('load', () => resolve());
    map.once('error', (e) => {
      if (String(e.error?.message ?? '').includes('style')) reject(e.error);
    });
  });

  map.addLayer({
    id: 'depth',
    type: 'raster',
    source: 'depth',
    paint: { 'raster-opacity': 1, 'raster-fade-duration': 0, 'raster-resampling': 'linear' },
  });

  map.addSource('land', { type: 'geojson', data: landFeatures(chart) });
  map.addSource('shore', { type: 'geojson', data: shoreFeatures(chart) });
  map.addSource('isobaths', { type: 'geojson', data: isobathFeatures(depth) });
  map.addSource('graticule', { type: 'geojson', data: graticuleFeatures() });
  map.addSource('route', { type: 'geojson', data: emptyCollection() });

  map.addLayer({
    id: 'graticule-minor',
    type: 'line',
    source: 'graticule',
    filter: ['==', ['get', 'major'], 0],
    paint: { 'line-color': PALETTES[theme].grid, 'line-width': 0.6, 'line-opacity': 0.7 },
  });
  map.addLayer({
    id: 'graticule-major',
    type: 'line',
    source: 'graticule',
    filter: ['==', ['get', 'major'], 1],
    paint: { 'line-color': PALETTES[theme].contour, 'line-width': 1 },
  });
  map.addLayer({
    id: 'land-fill',
    type: 'fill',
    source: 'land',
    paint: { 'fill-color': `rgb(${PALETTES[theme].land.join(',')})`, 'fill-opacity': 0.9 },
  });
  map.addLayer({
    id: 'isobath-minor',
    type: 'line',
    source: 'isobaths',
    filter: ['==', ['get', 'major'], 0],
    paint: {
      'line-color': PALETTES[theme].contour,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 13, 0.8, 16.5, 1.3],
      'line-dasharray': [3, 2.4],
      'line-opacity': 0.85,
    },
  });
  map.addLayer({
    id: 'isobath-major',
    type: 'line',
    source: 'isobaths',
    filter: ['==', ['get', 'major'], 1],
    paint: {
      'line-color': PALETTES[theme].contourMajor,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.7, 13, 1.3, 16.5, 1.9],
      'line-opacity': 0.9,
    },
  });
  map.addLayer({
    id: 'coastline',
    type: 'line',
    source: 'shore',
    paint: {
      'line-color': PALETTES[theme].coastline,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.9, 13, 1.6, 16.5, 2.3],
    },
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': PALETTES[theme].route,
      'line-width': 1.3,
      'line-dasharray': [3, 2.2],
      'line-opacity': 0.75,
    },
  });

  const handle: ChartMapHandle = {
    map,
    async setTheme(next: Theme) {
      const p = PALETTES[next];
      const img = await buildDepthImage(depth.grid, next);
      const src = map.getSource('depth') as unknown as {
        updateImage?: (o: { url: string; coordinates?: ImageCoordinates }) => void;
      };
      src?.updateImage?.({ url: rasterUrl(img), coordinates: img.coordinates as ImageCoordinates });
      map.setPaintProperty('background', 'background-color', `rgb(${p.seaDeep.join(',')})`);
      map.setPaintProperty('land-fill', 'fill-color', `rgb(${p.land.join(',')})`);
      map.setPaintProperty('coastline', 'line-color', p.coastline);
      map.setPaintProperty('isobath-minor', 'line-color', p.contour);
      map.setPaintProperty('isobath-major', 'line-color', p.contourMajor);
      map.setPaintProperty('graticule-minor', 'line-color', p.grid);
      map.setPaintProperty('graticule-major', 'line-color', p.contour);
      map.setPaintProperty('route-line', 'line-color', p.route);
    },
    focus(points, padding = 60) {
      if (points.length === 0) return;
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding, duration: 900, maxZoom: 14.6 },
      );
    },
    project(p) {
      const pt = map.project([p.lng, p.lat]);
      return { x: pt.x, y: pt.y };
    },
    unproject(x, y) {
      const ll = map.unproject([x, y]);
      return { lng: ll.lng, lat: ll.lat };
    },
    setRoute(points) {
      (map.getSource('route') as GeoJSONSource).setData({
        type: 'FeatureCollection',
        features:
          points.length >= 2
            ? [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString', coordinates: points.map((p) => [p.lng, p.lat]) },
                },
              ]
            : [],
      });
    },
    destroy() {
      map.remove();
    },
  };

  handle.setRoute(chart.route.waypoints.map((w) => w.position));
  return handle;
}
