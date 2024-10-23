package com.mapgrab.selenium;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mapgrab.selenium.controller.RelativeTo;
import com.mapgrab.selenium.controller.ScreenPoint;

public class MapLocator {
  private final WebDriver driver;
  private final String selector;
  private final JavascriptExecutor executor;
  private Function<SingleResult, String> _merge;
  private Integer index = null;

  public MapLocator(WebDriver driver, String selector) {
    this.driver = driver;
    this.selector = selector;
    this.executor = (JavascriptExecutor) driver;
  }

  public MapLocator(WebDriver driver, String selector, int index) {
    this(driver, selector);
    this.index = index;
  }

  public MapLocator(WebDriver driver, String selector, int index, Function<SingleResult, String> merge) {
    this(driver, selector);
    this.index = index;
    this._merge = merge;
  }

  public MapLocator first() {
    return this.nth(0);
  }

  public MapLocator last() {
    return this.nth(-1);
  }

  public MapLocator nth(int index) {
    this.index = index;

    return this;
  }

  public MapLocator merge(String property) {
    this._merge = (SingleResult x) -> x.properties.get(property);

    return this;
  }

  public MapLocator merge(Function<SingleResult, String> func) {
    this._merge = func;

    return this;
  }

  public void click() throws ToManyElementsError, ElementNotExisisError {
    this.prepareMouseAction().click().perform();
  }

  public void contextClick() throws ToManyElementsError, ElementNotExisisError {
    this.prepareMouseAction().contextClick().perform();
  }

  public void doubleClick() throws ToManyElementsError, ElementNotExisisError {
    this.prepareMouseAction().doubleClick().perform();
  }

  public void hover() throws ToManyElementsError, ElementNotExisisError {
    this.prepareMouseAction().perform();
  }

  public void fitMap() throws ToManyElementsError, ElementNotExisisError {
    Result element = this.getElement();

    // String mapId = element.getFeature();

    new MapController(driver, "mainMap").fitMapToBoundingBox(element.getDisplay());
  }

  public Actions prepareMouseAction() throws ElementNotExisisError, ToManyElementsError {
    Result element = this.getElement();
    ScreenPoint interactionPoint = element.getInteractionPoints().get(0);

    if (interactionPoint != null) {
      WebElement htmlElement = driver.findElement(By.cssSelector("html"));
      Dimension htmlElementSize = htmlElement.getSize();

      new Actions(driver)
          // moveToElement default move mouse position to center of element instead of
          // left top corner
          .moveToElement(htmlElement, -(htmlElementSize.getWidth() / 2), -(htmlElementSize.getHeight() / 2))
          .perform();

      return new Actions(driver).moveByOffset(interactionPoint.x, interactionPoint.y);
    }

    return new Actions(driver);
  }

  public BoundingBox boundingBox() throws ToManyElementsError, ElementNotExisisError {
    return this.boundingBox(RelativeTo.PARENT_WINDOW);
  }

  public BoundingBox boundingBox(RelativeTo relativeTo) throws ToManyElementsError, ElementNotExisisError {
    Result element = this.getElement();
    BoundingBox bbox = element.getDisplay();

    if (relativeTo == RelativeTo.ROOT_WINDOW) {
      LinkedHashMap<String, Long> result = (LinkedHashMap<String, Long>) this.executor
          .executeScript("return __MAPGRAB__.utils.frameAbsolutePosition(window)");

      int x = result.get("x").intValue();
      int y = result.get("y").intValue();

      bbox.applyOffset(x, y);
    }

    return bbox;
  }

  public int count() {
    ArrayList<? extends Result> elements = this.getElements();

    return elements.size();
  }

  public Result getElement() throws ElementNotExisisError, ToManyElementsError {
    ArrayList<? extends Result> elements = this.getElements();

    if (elements.size() > 1 && this.index == null) {
      throw new ToManyElementsError("");
    }

    if (elements.size() == 1) {
      return elements.get(0);
    }

    throw new ElementNotExisisError();
  }

  private ArrayList<? extends Result> getElements() {
    this.waitToMapStable();

    Object elements = this.executor.executeAsyncScript("""
         const resolve = arguments[arguments.length - 1];
         const locator = arguments[0];
         const data = __MAPGRAB__.query(locator);

         if (data.length > 0) {
           resolve(data);
         }

         const interval = setInterval(() => {
           const data = __MAPGRAB__.query(locator);

           if (data.length > 0) {
             clearInterval(interval);
             resolve(data);
           }
         }, 100);
        """, this.selector);

    ObjectMapper mapper = new ObjectMapper();
    ArrayList<SingleResult> objects = mapper.convertValue(elements, new TypeReference<ArrayList<SingleResult>>() {
    });

    objects.removeIf((x) -> !x.isVisible);

    ArrayList<? extends Result> res = objects;

    if (this._merge != null) {
      res = this.mergeResults(objects);
    }

    if (res.size() > 1 && this.index != null) {
      Result element = this.index < 0 ? res.get(res.size() - 1 + this.index) : res.get(this.index);

      if (element != null) {
        ArrayList<Result> singleRes = new ArrayList<Result>();
        // res.add(element);
        singleRes.add(element);

        return singleRes;
      }
    }

    return res;
  }

  private void waitToMapStable() {
    this.waitToMapInterface();

    this.executor.executeAsyncScript("""
        __MAPGRAB__.waitMapStableForLocator(arguments[0]).then(arguments[arguments.length - 1]);
        """, this.selector);
  }

  private void waitToMapInterface() {
    this.executor.executeAsyncScript("""
        var callback = arguments[arguments.length - 1];
              if (window.__MAPGRAB__) {
                callback();
                return;
              }

              const h = () => {
                window.removeEventListener('__MAPGRAB__::INTERFACE_INIT', h);
                callback();
              }

              window.addEventListener('__MAPGRAB__::INTERFACE_INIT', h);
          """);
  }

  private ArrayList<Result> mergeResults(ArrayList<SingleResult> results) {
    Map<String, Result> groupedFeatures = new HashMap<String, Result>();

    results.forEach(result -> {
      String key = this._merge.apply(result);

      if (groupedFeatures.get(key) != null) {
        Result resultA = groupedFeatures.get(key);
        groupedFeatures.replace(key, this.mergeResult(resultA, result));
      } else {
        groupedFeatures.put(key, result);
      }
    });

    return new ArrayList<Result>(groupedFeatures.values());
  }

  private Result mergeResult(Result resultA, Result resultB) {
    int minX = Math.min(resultA.getDisplay().x, resultB.getDisplay().x);
    int minY = Math.min(resultA.getDisplay().y, resultB.getDisplay().y);
    int maxX = Math.max(resultA.getDisplay().right, resultB.getDisplay().right);
    int maxY = Math.max(resultA.getDisplay().bottom, resultB.getDisplay().bottom);

    List<ScreenPoint> screenPoints = resultA.getInteractionPoints();
    screenPoints.addAll(resultB.getInteractionPoints());

    BoundingBox mapBounds = new BoundingBox(minX, minY, minX - maxX, minY - maxY);

    List<SingleResult> features = Collections.emptyList();

    return new MergedResult(screenPoints, features, mapBounds);
  }
}
