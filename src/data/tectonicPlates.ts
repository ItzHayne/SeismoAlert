/**
 * Simplified Major Tectonic Plate Boundaries GeoJSON (WGS84)
 * Covers Pacific Ring of Fire, Mid-Atlantic Ridge, Alpine-Himalayan,
 * San Andreas, Nazca Subduction Zone, etc.
 */

export interface TectonicLineFeature {
  type: 'Feature';
  properties: {
    name: string;
    type: 'Subduction' | 'Transform' | 'Spreading Ridge' | 'Collision';
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
}

export const TECTONIC_PLATES_GEOJSON: {
  type: 'FeatureCollection';
  features: TectonicLineFeature[];
} = {
  type: 'FeatureCollection',
  features: [
    // Pacific Ring of Fire - West Pacific Subduction (Kurile, Japan, Mariana, Philippines)
    {
      type: 'Feature',
      properties: { name: 'Western Pacific Subduction Zone', type: 'Subduction' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [160.0, 56.0], [156.0, 50.0], [145.0, 44.0], [142.0, 38.0],
          [140.0, 32.0], [137.0, 24.0], [128.0, 18.0], [126.0, 10.0],
          [125.0, 2.0], [130.0, -4.0], [140.0, -5.0], [150.0, -6.0],
          [158.0, -9.0], [168.0, -15.0], [178.0, -20.0], [179.0, -35.0],
          [175.0, -42.0], [168.0, -46.0]
        ]
      }
    },
    // Pacific Ring of Fire - Aleutians to Cascades
    {
      type: 'Feature',
      properties: { name: 'Aleutian Trench & Alaska Arc', type: 'Subduction' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [160.0, 56.0], [170.0, 54.0], [-175.0, 52.0], [-165.0, 53.0],
          [-155.0, 55.0], [-148.0, 59.0], [-138.0, 58.0], [-130.0, 52.0]
        ]
      }
    },
    // San Andreas & Queen Charlotte Transform Faults
    {
      type: 'Feature',
      properties: { name: 'San Andreas & Pacific-North American Faults', type: 'Transform' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-130.0, 52.0], [-127.0, 49.0], [-124.0, 43.0], [-122.0, 38.0],
          [-119.0, 34.5], [-116.0, 32.0], [-114.0, 29.0], [-108.0, 23.0]
        ]
      }
    },
    // Middle America Trench (Cocos Plate subduction)
    {
      type: 'Feature',
      properties: { name: 'Middle America Trench', type: 'Subduction' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-108.0, 23.0], [-105.0, 19.0], [-100.0, 16.0], [-95.0, 14.5],
          [-90.0, 13.0], [-85.0, 10.0], [-82.0, 8.0]
        ]
      }
    },
    // Peru-Chile (Atacama) Trench (Nazca Plate subduction under South America)
    {
      type: 'Feature',
      properties: { name: 'Peru-Chile Trench (Nazca Subduction)', type: 'Subduction' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-81.0, 2.0], [-81.5, -5.0], [-79.0, -12.0], [-74.0, -17.0],
          [-71.5, -23.0], [-71.0, -32.0], [-74.0, -40.0], [-75.0, -46.0],
          [-73.0, -52.0]
        ]
      }
    },
    // Mid-Atlantic Ridge (Spreading center)
    {
      type: 'Feature',
      properties: { name: 'Mid-Atlantic Ridge', type: 'Spreading Ridge' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-18.0, 72.0], [-18.5, 65.0], [-25.0, 55.0], [-30.0, 45.0],
          [-38.0, 35.0], [-42.0, 25.0], [-44.0, 15.0], [-38.0, 5.0],
          [-28.0, 0.0], [-20.0, -8.0], [-14.0, -16.0], [-12.0, -25.0],
          [-15.0, -35.0], [-18.0, -45.0], [-14.0, -53.0]
        ]
      }
    },
    // Alpine-Himalayan Orogenic Belt
    {
      type: 'Feature',
      properties: { name: 'Alpine-Himalayan Belt', type: 'Collision' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-9.0, 36.0], [2.0, 37.0], [12.0, 38.0], [22.0, 38.0],
          [28.0, 39.0], [36.0, 38.0], [45.0, 37.0], [55.0, 32.0],
          [65.0, 28.0], [72.0, 34.0], [80.0, 30.0], [90.0, 28.0],
          [98.0, 24.0], [98.0, 15.0], [98.0, 5.0]
        ]
      }
    },
    // Sunda Megathrust (Sumatra / Java Trench)
    {
      type: 'Feature',
      properties: { name: 'Sunda Trench (Sumatra-Java)', type: 'Subduction' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [92.0, 14.0], [93.5, 8.0], [96.0, 2.0], [100.0, -3.0],
          [106.0, -7.5], [115.0, -9.5], [125.0, -10.0], [132.0, -8.0]
        ]
      }
    },
    // East African Rift System
    {
      type: 'Feature',
      properties: { name: 'East African Rift System', type: 'Spreading Ridge' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [43.0, 12.0], [39.0, 8.0], [36.0, 2.0], [35.0, -4.0],
          [34.0, -10.0], [35.0, -16.0], [34.0, -20.0]
        ]
      }
    }
  ]
};
