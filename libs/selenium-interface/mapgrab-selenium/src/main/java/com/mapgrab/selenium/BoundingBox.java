package com.mapgrab.selenium;

public class BoundingBox {
  public int x;
  public int y;
  public int width;
  public int height;
  public int right;
  public int bottom;

  public BoundingBox() {
    super();
  }

  public BoundingBox(int x, int y, int width, int height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.right = x + width;
    this.bottom = y + height;
  }

  public void applyPadding(int padding) {
    this.applyPadding(padding, padding, padding, padding);
  }

  public void applyPadding(int paddingX, int paddingY) {
    this.applyPadding(paddingY, paddingX, paddingY, paddingX);
  }

  public void applyPadding(int paddingTop, int paddingRight, int paddingBottom, int paddingLeft) {
    this.x = this.x - paddingLeft;
    this.y = this.y - paddingTop;
    this.right = this.right + paddingLeft + paddingRight;
    this.bottom = this.bottom + paddingLeft + paddingBottom;
    this.width = this.right - this.x;
    this.height = this.bottom - this.y;
  }

  public void applyOffset(int offset) {
    this.applyOffset(offset, offset);
  }

  public void applyOffset(int offsetX, int offsetY) {
    this.x = this.x + offsetX;
    this.y = this.y + offsetY;

    this.right = this.right + offsetX;
    this.bottom = this.bottom + offsetY;
  }
}
