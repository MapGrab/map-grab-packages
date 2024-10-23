package com.mapgrab.selenium.controller;

public class MapBounds {
  public LngLat sw;
  public LngLat ne;

  public MapBounds(LngLat sw, LngLat ne) {
    this.sw = sw;
    this.ne = ne;
  }

  public MapBounds(double[][] bounds) {
    this.sw = new LngLat(bounds[0][0], bounds[0][1]);
    this.ne = new LngLat(bounds[1][0], bounds[1][1]);
  }

  public double[][] encodeToBoundsLike() {
    double[][] data = { { this.sw.lng, this.sw.lat }, { this.ne.lng, this.ne.lat } };

    return data;
  }
}
