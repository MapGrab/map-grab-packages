package com.mapgrab.selenium;

import com.mapgrab.selenium.controller.InteractionPoint;

public class ResultDisplay {
  public int[] bbox;
  public int displayWidth;
  public int displayHeight;
  public InteractionPoint[] interactionPoints;

  public ResultDisplay() {
    super();
  }

  public ResultDisplay(int[] bbox, int displayWidth, int displayHeight, InteractionPoint[] interactionPoints) {
    this.bbox = bbox;
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    this.interactionPoints = interactionPoints;
  }
}
