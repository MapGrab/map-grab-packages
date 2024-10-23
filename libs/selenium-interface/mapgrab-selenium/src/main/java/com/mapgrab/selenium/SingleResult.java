package com.mapgrab.selenium;

import java.util.List;
import java.util.Map;

import com.mapgrab.selenium.controller.ScreenPoint;

public class SingleResult implements Result {
  public String featureId;
  public String sourceId;
  public String layerId;
  public String mapId;
  public Boolean isVisible;
  public Map<String, String> properties;
  public List<ScreenPoint> interactionPoints;
  public BoundingBox rect;

  @Override
  public BoundingBox getDisplay() {
    return rect;
  }

  @Override
  public List<ScreenPoint> getInteractionPoints() {
    return interactionPoints;
  }
}
