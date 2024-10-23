package com.mapgrab.selenium.controller;

public class FitBoundsOptions extends SetViewOptions {
  public Boolean linear;
  public int[] offset;
  public Double maxZoom;
  public Double curve;
  public Double minZoom;
  public Double speed;
  public Double screenSpeed;
  public Double maxDuration;
  public Double padding;
  public Double duration;
  public Boolean animate;
  public Boolean essential;

  public Boolean getFreezeElevation() {
    return freezeElevation;
  }

  public FitBoundsOptions setFreezeElevation(Boolean freezeElevation) {
    this.freezeElevation = freezeElevation;

    return this;
  }

  public Boolean getEssential() {
    return essential;
  }

  public FitBoundsOptions setEssential(Boolean essential) {
    this.essential = essential;

    return this;
  }

  public Boolean getAnimate() {
    return animate;
  }

  public FitBoundsOptions setAnimate(Boolean animate) {
    this.animate = animate;

    return this;
  }

  public Double getDuration() {
    return duration;
  }

  public FitBoundsOptions setDuration(Double duration) {
    this.duration = duration;

    return this;
  }

  public Double getMaxDuration() {
    return maxDuration;
  }

  public FitBoundsOptions setMaxDuration(Double maxDuration) {
    this.maxDuration = maxDuration;

    return this;
  }

  public Double getScreenSpeed() {
    return screenSpeed;
  }

  public FitBoundsOptions setScreenSpeed(Double screenSpeed) {
    this.screenSpeed = screenSpeed;

    return this;
  }

  public Double getSpeed() {
    return speed;
  }

  public FitBoundsOptions setSpeed(Double speed) {
    this.speed = speed;

    return this;
  }

  public Double getMinZoom() {
    return minZoom;
  }

  public FitBoundsOptions setMinZoom(Double minZoom) {
    this.minZoom = minZoom;

    return this;
  }

  public Double getCurve() {
    return curve;
  }

  public FitBoundsOptions setCurve(Double curve) {
    this.curve = curve;

    return this;
  }

  public Double getMaxZoom() {
    return maxZoom;
  }

  public FitBoundsOptions setMaxZoom(Double maxZoom) {
    this.maxZoom = maxZoom;

    return this;
  }

  public int[] getOffset() {
    return offset;
  }

  public FitBoundsOptions setOffset(int[] offset) {
    this.offset = offset;

    return this;
  }

  public Boolean getLinear() {
    return linear;
  }

  public FitBoundsOptions setLinear(Boolean linear) {
    this.linear = linear;

    return this;
  }

  public Boolean freezeElevation;
}
