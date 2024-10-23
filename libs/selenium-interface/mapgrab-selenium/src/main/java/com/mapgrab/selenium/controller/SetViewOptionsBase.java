package com.mapgrab.selenium.controller;

public class SetViewOptionsBase {
  public Double pitch;
  public Double zoom;
  public Double bearing;
  public LngLat around;
  public PaddingOptions padding;

  public LngLat getAround() {
    return around;
  }

  public SetViewOptionsBase setAround(LngLat around) {
    this.around = around;

    return this;
  }

  public Double getBearing() {
    return bearing;
  }

  public SetViewOptionsBase setBearing(Double bearing) {
    this.bearing = bearing;

    return this;
  }

  public Double getZoom() {
    return zoom;
  }

  public SetViewOptionsBase setZoom(Double zoom) {
    this.zoom = zoom;

    return this;
  }

  public Double getPitch() {
    return pitch;
  }

  public SetViewOptionsBase setPitch(Double pitch) {
    this.pitch = pitch;

    return this;
  }

  public PaddingOptions getPadding() {
    return padding;
  }

  public SetViewOptionsBase setPadding(PaddingOptions padding) {
    this.padding = padding;

    return this;
  }
}
