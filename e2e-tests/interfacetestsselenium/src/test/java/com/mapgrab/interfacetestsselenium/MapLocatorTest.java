package com.mapgrab.interfacetestsselenium;

import com.mapgrab.selenium.*;
import com.mapgrab.selenium.controller.*;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.Assert;
import org.testng.annotations.Test;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.AfterMethod;

/**
 * Unit test for simple App.
 */
public class MapLocatorTest {
  WebDriver driver;
  MapController controller;

  @BeforeMethod
  public void beforeEach() {
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless=new");

    driver = new ChromeDriver(options);
    driver.get("http://localhost:4200/maplibre/");
    controller = new MapController(driver, "mainMap");
  }

  @AfterMethod
  public void afterEach() {
    driver.quit();
  }

  @Test(description = "click() method should click element on map")
  public void clickShouldClickElementOnMap() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines] filter[\"==\",[\"get\",\"name\"],\"Tropic of Cancer\"]");
    MapEventSpy spy = new MapEventSpy(driver);
    controller.waitToMapLoaded();;
    spy.addSpyOn("mainMap", "geolines", "click");

    locator.click();

    Assert.assertEquals(spy.getSpyVal().get("type"), "click");
  }

  @Test(description = "contextClick method should right click element on map")
  public void contextClickShouldTriggerContextmenu() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines] filter[\"==\",[\"get\",\"name\"],\"Tropic of Cancer\"]");
    MapEventSpy spy = new MapEventSpy(driver);
    controller.waitToMapLoaded();;
    spy.addSpyOn("mainMap", "geolines", "contextmenu");

    locator.contextClick();

    Assert.assertEquals(spy.getSpyVal().get("type"), "contextmenu");
  }

  @Test(description = "doubleClick method should right click element on map")
  public void doubleClickShouldTriggerDblClick() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines] filter[\"==\",[\"get\",\"name\"],\"Tropic of Cancer\"]");
    MapEventSpy spy = new MapEventSpy(driver);
    controller.waitToMapLoaded();;
    spy.addSpyOn("mainMap", "geolines", "dblclick");

    locator.doubleClick();

    Assert.assertEquals(spy.getSpyVal().get("type"), "dblclick");
  }

  @Test(description = "boundingBox() should return element bounding box")
  public void boundingBoxShouldReturnBoundsingBox() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines] filter[\"==\",[\"get\",\"name\"],\"Tropic of Cancer\"]");

    BoundingBox bbox = locator.boundingBox();

    Assert.assertEquals(bbox.x, 88);
    Assert.assertEquals(bbox.y, 337);
  }

  @Test(description = "count() should return element count on map")
  public void countShouldReturnElementsCountOnMap() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines]");

    Assert.assertEquals(locator.count(), 5);
  }

  @Test(description = "first() should return first element from collection")
  public void firstShouldReturnFirstElementFromCollection() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines]");

    Assert.assertEquals(locator.first().count(), 1);
  }

  @Test(description = "last() should return first element from collection")
  public void lastShouldReturnLastElementFromCollection() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines]");

    Assert.assertEquals(locator.last().count(), 1);
  }

  @Test(description = "nth() should return first element from collection")
  public void nthShouldReturnIndexElementFromCollection() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines]");

    Assert.assertEquals(locator.nth(1).count(), 1);
  }

  @Test(description = "fitMap() should fit map to locator bounds")
  public void fitMapShouldReturnFirstElementFromCollection() throws ToManyElementsError, ElementNotExisisError {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=countries-fill] filter[\"==\",[\"get\",\"NAME\"],\"Poland\"]");
    locator.last().fitMap();
  }
}
