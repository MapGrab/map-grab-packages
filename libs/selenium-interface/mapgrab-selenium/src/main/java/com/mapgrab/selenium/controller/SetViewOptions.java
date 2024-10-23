package com.mapgrab.selenium.controller;

public class SetViewOptions extends SetViewOptionsBase {
  public LngLat center;

  public LngLat getCenter() {
    return center;
  }

  public SetViewOptions setCenter(LngLat center) {
    this.center = center;

    return this;
  }
}
