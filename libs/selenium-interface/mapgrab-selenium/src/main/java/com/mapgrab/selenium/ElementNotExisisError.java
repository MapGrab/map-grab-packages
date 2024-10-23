package com.mapgrab.selenium;

public class ElementNotExisisError extends Exception {
  public ElementNotExisisError() {
    super("Element not exists");
  }
}