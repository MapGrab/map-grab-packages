package com.mapgrab.selenium;

import java.util.HashMap;
import java.util.Map;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.mapgrab.selenium.controller.FitBoundsOptions;
import com.mapgrab.selenium.controller.LngLat;
import com.mapgrab.selenium.controller.MapBounds;
import com.mapgrab.selenium.controller.MutationState;
import com.mapgrab.selenium.controller.ScreenPoint;
import com.mapgrab.selenium.controller.SetAbsoluteViewOptions;
import com.mapgrab.selenium.controller.SetViewOptions;

public class MapController {
  protected final JavascriptExecutor executor;
  protected final String mapId;

  public MapController(WebDriver driver, String mapId) {
    this.mapId = mapId;
    this.executor = (JavascriptExecutor) driver;
  }

  public void waitToMapStable() {
    this.waitToMapInterface();

    this.executor.executeAsyncScript("""
          const mapId = arguments[0];
          const resolve = arguments[arguments.length - 1];

          const isStablePromise = __MAPGRAB__.getMapInterface(mapId).controller.waitToMapStable();
          isStablePromise && isStablePromise.then ? isStablePromise.then(resolve) : resolve();
        """,
        mapId);
  }

  public void enableInspector() {
    this.waitToMapInterface();

    this.executor.executeScript(
        """
               __MAPGRAB__.enableInspector();
            """);
  }

  public void disableInspector() {
    this.waitToMapInterface();

    this.executor.executeScript(
        """
               __MAPGRAB__.disableInspector();
            """);
  }

  public void waitToMapLoaded() {
    this.waitToMapInterface();

    this.executor.executeAsyncScript(
        """
              const mapId = arguments[0];
              const resolve = arguments[arguments.length - 1];

              const waitToMapLoadedPromise = __MAPGRAB__.getMapInterface(mapId).controller.waitToMapLoaded();
              waitToMapLoadedPromise && waitToMapLoadedPromise.then ? waitToMapLoadedPromise.then(resolve) : resolve()
            """,
        mapId);
  }

  public void setView(SetViewOptions options) {
    this.waitToMapLoaded();

    ObjectMapper mapper = new ObjectMapper();
    mapper.setSerializationInclusion(Include.NON_NULL);
    Map<String, Object> args = mapper.convertValue(options, Map.class);

    this.executor.executeScript(
        "console.log(arguments); __MAPGRAB__.getMapInterface(arguments[0]).controller.setView(arguments[1])",
        mapId, args);

    this.waitToMapStable();
  }

  public void setViewAbsolute(SetAbsoluteViewOptions options) {
    this.waitToMapLoaded();

    ObjectMapper mapper = new ObjectMapper();
    mapper.setSerializationInclusion(Include.NON_NULL);
    Map<String, Object> args = mapper.convertValue(options, Map.class);

    this.executor.executeScript(
        "console.log(arguments); __MAPGRAB__.getMapInterface(arguments[0]).controller.setViewAbsolute(arguments[1])",
        mapId, args);

    this.waitToMapStable();
  }

  public void fitMapToBounds(MapBounds bounds, FitBoundsOptions options) {
    ObjectMapper mapper = new ObjectMapper();
    mapper.setSerializationInclusion(Include.NON_NULL);
    Map<String, Object> optionsT = mapper.convertValue(options, Map.class);

    this.executor.executeScript(
        "__MAPGRAB__.getMapInterface(arguments[0]).controller.fitMapToBounds(arguments[1], arguments[2]) ",
        mapId, bounds.encodeToBoundsLike(), optionsT);

    this.waitToMapStable();
  }

  public void fitMapToBounds(MapBounds bounds) {
    this.fitMapToBounds(bounds, null);
  }

  public void fitMapToBoundingBox(BoundingBox bounds, FitBoundsOptions options) {
    ObjectMapper mapper = new ObjectMapper();
    mapper.setSerializationInclusion(Include.NON_NULL);
    Map<String, Object> boundsT = mapper.convertValue(bounds, Map.class);
    Map<String, Object> optionsT = mapper.convertValue(options, Map.class);

    this.executor.executeScript(
        "__MAPGRAB__.getMapInterface(arguments[0]).controller.fitMapToBoundingBox(arguments[1], arguments[2]) ",
        mapId, boundsT, optionsT);

    this.waitToMapStable();
  }

  public void fitMapToBoundingBox(BoundingBox bounds) {
    this.fitMapToBoundingBox(bounds, null);
  }

  public void setBackgroundColor(String color) {
    this.executor.executeScript(
        "__MAPGRAB__.getMapInterface(arguments[0]).controller.setBackgroundColor(arguments[1])",
        mapId, color);

    this.waitToMapStable();
  }

  public void removeBackground() {
    this.executor.executeScript(
        "__MAPGRAB__.getMapInterface(arguments[0]).controller.removeBackground()",
        mapId);

    this.waitToMapStable();
  }

  public ScreenPoint projectLngLatToScreenPoint(LngLat lngLat) {
    this.waitToMapStable();

    ObjectMapper mapper = new ObjectMapper();
    Map<String, Object> args = mapper.convertValue(lngLat, Map.class);

    Object res = this.executor.executeScript(
        "return __MAPGRAB__.getMapInterface(arguments[0]).controller.projectLngLatToScreenPoint(arguments[1])",
        mapId, args);

    return mapper.convertValue(res, ScreenPoint.class);
  }

  public LngLat unprojectScreenPointToLngLat(ScreenPoint point) {
    this.waitToMapStable();

    ObjectMapper mapper = new ObjectMapper();
    Map<String, Object> args = mapper.convertValue(point, Map.class);

    Object res = this.executor.executeScript(
        "return __MAPGRAB__.getMapInterface(arguments[0]).controller.unprojectScreenPointToLngLat(arguments[1])",
        mapId, args);

    return mapper.convertValue(res, LngLat.class);
  }

  public HashMap<String, MutationState> exposeLayers(String[] layersToExpose, String[] layersToHide) {
    this.waitToMapStable();

    Object res = this.executor.executeScript(
        "return __MAPGRAB__.getMapInterface(arguments[0]).controller.exposeLayers(arguments[1], arguments[2] || 'allOther')",
        mapId, layersToExpose, layersToHide);

    this.waitToMapStable();

    ObjectMapper mapper = new ObjectMapper();
    TypeFactory factory = TypeFactory.defaultInstance();

    return mapper.convertValue(res, factory.constructMapType(HashMap.class, String.class, MutationState.class));
  }

  public HashMap<String, MutationState> exposeLayers(String[] layersToExpose) {
    return this.exposeLayers(layersToExpose, null);
  }

  public void revertExposeLayers(HashMap<String, MutationState> exposeMutationState) {
    ObjectMapper mapper = new ObjectMapper();
    Map<String, Object> exposeMutationStateT = mapper.convertValue(exposeMutationState, Map.class);

    this.executor.executeScript(
        "__MAPGRAB__.getMapInterface(arguments[0]).controller.revertExposeLayers(arguments[1])",
        mapId, exposeMutationStateT);

    this.waitToMapStable();
  }

  private void waitToMapInterface() {
    this.executor.executeAsyncScript("""
        var callback = arguments[arguments.length - 1];

        if (window.__MAPGRAB__ && window.__MAPGRAB__.getMapInterface(arguments[0])) {
          callback();
          return;
        }

              const h = () => {
                if (window.__MAPGRAB__ && window.__MAPGRAB__.getMapInterface(arguments[0])) {
                   window.removeEventListener('__MAPGRAB__::MAP_INTERFACE_INIT', h);
                      callback();
                }
              }

              window.addEventListener('__MAPGRAB__::MAP_INTERFACE_INIT', h);
          """, mapId);
  }

}
