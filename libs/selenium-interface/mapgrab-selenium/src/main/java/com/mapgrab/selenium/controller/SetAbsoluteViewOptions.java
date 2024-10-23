package com.mapgrab.selenium.controller;

public class SetAbsoluteViewOptions extends SetViewOptionsBase {
  public ScreenPoint center;

  public ScreenPoint getCenter() {
    return center;
  }

  public SetAbsoluteViewOptions setCenter(ScreenPoint center) {
    this.center = center;

    return this;
  }
}
