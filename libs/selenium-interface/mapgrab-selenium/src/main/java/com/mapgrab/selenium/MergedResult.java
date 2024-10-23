package com.mapgrab.selenium;

import java.util.List;

import com.mapgrab.selenium.controller.ScreenPoint;

public class MergedResult implements Result {
  public List<ScreenPoint> interactionPoints;
  public BoundingBox rect;
  public List<SingleResult> features;

  MergedResult(List<ScreenPoint> interactionPoints, List<SingleResult> features, BoundingBox rect) {
    this.features = features;
    this.rect = rect;
    this.interactionPoints = interactionPoints;
  }

  @Override
  public BoundingBox getDisplay() {
    return rect;
  }

  @Override
  public List<ScreenPoint> getInteractionPoints() {
    return interactionPoints;
  }
}
