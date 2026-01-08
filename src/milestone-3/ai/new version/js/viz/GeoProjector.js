// viz/GeoProjector.js
export class GeoProjector {
  constructor(bounds, padding = 60) {
    this.bounds = bounds; // {minLat,maxLat,minLon,maxLon}
    this.padding = padding;
  }

  project(p, lat, lon, w, h) {
    const x = p.map(lon, this.bounds.minLon, this.bounds.maxLon, this.padding, w - this.padding);
    const y = p.map(lat, this.bounds.maxLat, this.bounds.minLat, this.padding, h - this.padding); // note inverted
    return p.createVector(x, y);
  }
}
