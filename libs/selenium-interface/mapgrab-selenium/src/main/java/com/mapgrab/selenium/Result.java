package com.mapgrab.selenium;

import java.util.List;

import com.mapgrab.selenium.controller.ScreenPoint;

public interface Result {
  public BoundingBox getDisplay();

  public List<ScreenPoint> getInteractionPoints();
}
