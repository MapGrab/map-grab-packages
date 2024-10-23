package com.mapgrab.interfacetestsselenium;

import com.mapgrab.selenium.BoundingBox;
import com.mapgrab.selenium.MapController;
import com.mapgrab.selenium.controller.*;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.Assert;
import org.testng.annotations.Test;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.AfterMethod;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * Unit test for simple App.
 */
public class MapControllerTest {
  WebDriver driver;
  ControllerSpy controller;

  @BeforeMethod
  public void beforeEach() {
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless=new");

    driver = new ChromeDriver(options);
    driver.get("http://localhost:4200/maplibre/");
    controller = new ControllerSpy(driver, "mainMap");
  }

  @AfterMethod
  public void afterEach() {
     driver.quit();
  }

  @Test(description = "should execute waitToMapLoaded method on map controller")
  public void waitToMapLoadedShouldExecuteMapControllerMethod() {
    controller.createSpyMethod("waitToMapLoaded");
    controller.waitToMapLoaded();

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("waitToMapLoaded");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);

    Assert.assertNotNull(firstCall);
  }

  @Test(description = "should execute waitToMapStable method on map controller")
  public void waitToMapStableShouldExecuteMapControllerMethod() {
    controller.createSpyMethod("waitToMapStable");

    controller.waitToMapStable();

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("waitToMapStable");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);

    Assert.assertNotNull(firstCall);
  }

  @Test(description = "should execute setView method on map controller")
  public void setViewShouldExecuteMapControllerMethod() {
    SetViewOptions opts = new SetViewOptions();
    opts.setCenter(new LngLat(11, 12));

    controller.createSpyMethod("setView");
    controller.setView(opts);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("setView");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    LinkedHashMap<String, Object> options = (LinkedHashMap<String, Object>) firstCall.get(0);
    LinkedHashMap<String, Object> center = (LinkedHashMap<String, Object>) options.get("center");

    Assert.assertEquals(((Long) center.get("lng")).intValue(), 11);
    Assert.assertEquals(((Long) center.get("lat")).intValue(), 12);
  }

  @Test(description = "should execute setViewAbsolute method on map controller")
  public void setViewAbsoluteShouldExecuteMapControllerMethod() {
    SetAbsoluteViewOptions opts = new SetAbsoluteViewOptions();
    opts.setCenter(new ScreenPoint(11, 12));

    controller.createSpyMethod("setViewAbsolute");
    controller.setViewAbsolute(opts);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("setView");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    LinkedHashMap<String, Object> options = (LinkedHashMap<String, Object>) firstCall.get(0);
    LinkedHashMap<String, Object> center = (LinkedHashMap<String, Object>) options.get("center");

    Assert.assertEquals(((Long) center.get("x")).intValue(), 11);
    Assert.assertEquals(((Long) center.get("y")).intValue(), 12);
  }

  @Test(description = "should execute fitMapToBounds method on map controller")
  public void fitMapToBoundsShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("fitMapToBounds");
    double[][] xw = { { 11, 12 }, { 14, 15 } };

    MapBounds bbox = new MapBounds(xw);

    controller.fitMapToBounds(bbox);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("fitMapToBounds");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    ArrayList<ArrayList<Long>> bounds = (ArrayList<ArrayList<Long>>) firstCall.get(0);

    Assert.assertEquals(bounds.get(0).get(0), 11);
    Assert.assertEquals(bounds.get(0).get(1), 12);

    Assert.assertEquals(bounds.get(1).get(0), 14);
    Assert.assertEquals(bounds.get(1).get(1), 15);
  }

  @Test(description = "should execute fitMapToBoundingBox method on map controller")
  public void fitMapToBoundingBoxShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("fitMapToBoundingBox");

    BoundingBox bbox = new BoundingBox(11, 12, 200, 300);

    controller.fitMapToBoundingBox(bbox);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("fitMapToBoundingBox");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    LinkedHashMap<String, Long> bounds = (LinkedHashMap<String, Long>) firstCall.get(0);

    Assert.assertEquals(bounds.get("x").intValue(), 11);
    Assert.assertEquals(bounds.get("y").intValue(), 12);

    Assert.assertEquals(bounds.get("width").intValue(), 200);
    Assert.assertEquals(bounds.get("height").intValue(), 300);
  }

  @Test(description = "should execute setBackgroundColor method on map controller")
  public void setBackgroundColorShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("setBackgroundColor");

    controller.setBackgroundColor("red");

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("setBackgroundColor");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);

    Assert.assertEquals(firstCall.get(0), "red");
  }

  @Test(description = "should execute removeBackground method on map controller")
  public void removeBackgroundShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("removeBackground");

    controller.removeBackground();

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("removeBackground");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);

    Assert.assertNotNull(firstCall);
  }

  @Test(description = "should execute projectLngLatToScreenPoint method on map controller")
  public void projectLngLatToScreenPointShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("projectLngLatToScreenPoint");

    LngLat point = new LngLat(11, 12);
    controller.projectLngLatToScreenPoint(point);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller
        .getSpyMethod("projectLngLatToScreenPoint");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    LinkedHashMap<String, Long> lngLat = (LinkedHashMap<String, Long>) firstCall.get(0);

    Assert.assertEquals(lngLat.get("lng"), 11);
    Assert.assertEquals(lngLat.get("lat"), 12);
  }

  @Test(description = "should execute unprojectScreenPointToLngLat method on map controller")
  public void unprojectScreenPointToLngLatShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("unprojectScreenPointToLngLat");

    ScreenPoint point = new ScreenPoint(11, 12);
    LngLat returnedPoint = controller.unprojectScreenPointToLngLat(point);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller
        .getSpyMethod("unprojectScreenPointToLngLat");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    LinkedHashMap<String, Long> lngLat = (LinkedHashMap<String, Long>) firstCall.get(0);

    Assert.assertEquals(lngLat.get("x"), 11);
    Assert.assertEquals(lngLat.get("y"), 12);

    Assert.assertTrue(returnedPoint.lat >= 79 && returnedPoint.lat < 81.5);
  }

  @Test(description = "should execute exposeLayers method on map controller")
  public void exposeLayersShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("exposeLayers");

    HashMap<String, MutationState> state = controller.exposeLayers(new String[] { "geolines" });

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("exposeLayers");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    List<String> exposeLayersArg = (List<String>) firstCall.get(0);

    Assert.assertEquals(exposeLayersArg.get(0), "geolines");
    Assert.assertNull(state.get("geolines"));
    Assert.assertEquals(state.get("geolines-label").getTo(), "none");
  }

  @Test(description = "should execute revertExposeLayers method on map controller")
  public void revertExposeLayersShouldExecuteMapControllerMethod() throws InterruptedException {
    controller.createSpyMethod("revertExposeLayers");

    HashMap<String, MutationState> state = controller.exposeLayers(new String[] { "geolines" });
    controller.revertExposeLayers(state);

    LinkedHashMap<String, Object> x = (LinkedHashMap<String, Object>) controller.getSpyMethod("revertExposeLayers");
    List<Object> firstCall = (List<Object>) ((List<Object>) x.get("calls")).get(0);
    HashMap<String, MutationState> exposeLayersArg = (HashMap<String, MutationState>) firstCall.get(0);

    Assert.assertNotNull(exposeLayersArg.get("countries-fill"));
  }
}
