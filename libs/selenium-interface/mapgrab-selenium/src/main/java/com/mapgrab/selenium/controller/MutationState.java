package com.mapgrab.selenium.controller;

public class MutationState {
  private String from;
  private String to;

  public MutationState() {
    super();
  }

  public MutationState(String from, String to) {
    this.from = from;
    this.to = to;
  }

  public String getFrom() {
    return from;
  }

  public String getTo() {
    return to;
  }
}
