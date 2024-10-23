package com.mapgrab.interfacetestsselenium;

import com.mapgrab.selenium.MapController;
import org.openqa.selenium.WebDriver;

public class ControllerSpy extends MapController {
  public ControllerSpy(WebDriver driver, String mapId) {
    super(driver, mapId);
  }

  public void createSpyMethod(String methodName) {
    this.waitToMapLoaded();

    this.executor.executeScript("""
      const mapId = arguments[0];
      const controller = __MAPGRAB__.getMapInterface(mapId).controller;

      controller.spies = { calls: [] };

      const originalFunc = controller[arguments[1]];
      controller[arguments[1]] = function(...args) {
        controller.spies.calls.push(args);
        return originalFunc.apply(controller, arguments);
      }
      """, mapId, methodName);
  }

  public Object getSpyMethod(String methodName) {
    this.waitToMapLoaded();

    return this.executor.executeScript("""
      const mapId = arguments[0];

      return __MAPGRAB__.getMapInterface(mapId).controller.spies;
      """, mapId);
  }
}
