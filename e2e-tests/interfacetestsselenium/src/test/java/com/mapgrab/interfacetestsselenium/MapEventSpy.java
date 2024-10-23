package com.mapgrab.interfacetestsselenium;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

import java.util.LinkedHashMap;

public class MapEventSpy {
  protected final JavascriptExecutor executor;

  public MapEventSpy(WebDriver driver) {
    this.executor = (JavascriptExecutor) driver;
  }

  public void addSpyOn(String mapId, String layerId, String eventName) {
    this.executor.executeScript("""
        const [mapId, layerId, eventName] = arguments;

        window.addEventListener('mousemove', console.log);
        window.addEventListener('mouseenter', console.log);

        window['spyHandler'] = {};
        __MAPGRAB__.getMapInterface(mapId).map.on(eventName, layerId, () => {
          console.log('asd');
            window['spyHandler'] = { type: eventName };
        })
      """, mapId, layerId, eventName );
  }

  public LinkedHashMap<String, String> getSpyVal() {
    return (LinkedHashMap<String, String>) this.executor.executeScript("""
        return window['spyHandler'];
      """);
  }
}
