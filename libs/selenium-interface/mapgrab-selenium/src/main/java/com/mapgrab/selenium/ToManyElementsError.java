package com.mapgrab.selenium;

public class ToManyElementsError extends Exception {
  public ToManyElementsError(String errorMessage) {
    super(errorMessage);
  }
}