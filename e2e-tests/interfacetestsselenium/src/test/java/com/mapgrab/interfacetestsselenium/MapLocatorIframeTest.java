package com.mapgrab.interfacetestsselenium;

import com.mapgrab.selenium.*;
import com.mapgrab.selenium.controller.*;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.Assert;
import org.testng.annotations.Test;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.AfterMethod;

import java.util.*;

/**
 * Unit test for simple App.
 */
public class MapLocatorIframeTest {
  WebDriver driver;
  MapController controller;

  @BeforeMethod
  public void beforeEach() {
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--window-size=1000,660");
    options.addArguments("--force-device-scale-factor=1");
    options.addArguments("--headless=new");

    options.setExperimentalOption("excludeSwitches", Collections.singletonList("enable-automation"));
    options.setExperimentalOption("useAutomationExtension", false);

    driver = new ChromeDriver(options);
    driver.get("http://localhost:4200/maplibre/iframe");

    WebElement iframe = driver.findElement(By.cssSelector("iframe"));
    driver = driver.switchTo().frame(iframe);
    controller = new MapController(driver, "mainMap");
  }

  @AfterMethod
  public void afterEach() {
    driver.quit();
  }

  @Test(description = "click() method should click element on map in iframe")
  public void clickShouldClickElementOnMapInIframe() throws ToManyElementsError, ElementNotExisisError, InterruptedException {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines] filter[\"==\",[\"get\",\"name\"],\"Equator\"]");
    MapEventSpy spy = new MapEventSpy(driver);
    controller.waitToMapLoaded();
    spy.addSpyOn("mainMap", "geolines", "click");

    locator.click();

    Assert.assertEquals(spy.getSpyVal().get("type"), "click");
  }

  @Test(description = "boundingBox() method should return bounds relative to iframe")
  public void boundingBoxShouldReturnBoundsRelativeToIframe() throws ToManyElementsError, ElementNotExisisError, InterruptedException {
    MapLocator locator = new MapLocator(driver, "map[id=mainMap] layer[id=geolines-label] filter[\"==\",[\"get\",\"name\"],\"Equator\"]").first();
    controller.waitToMapLoaded();

    BoundingBox bbox = locator.boundingBox(RelativeTo.ROOT_WINDOW);

    Assert.assertEquals(bbox.x, 322);
    Assert.assertEquals(bbox.y, 378);
  }
}
