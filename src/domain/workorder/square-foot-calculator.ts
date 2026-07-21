export class SquareFootCalculator {
  /**
   * Calculates the square footage from width and height.
   * Assumes width and height are in the same unit (e.g. feet).
   * @param width Width
   * @param height Height
   * @returns Square footage
   */
  static calculateSqFt(width: number, height: number): number {
    return (width || 0) * (height || 0);
  }

  /**
   * Calculates the total area for a given quantity.
   * @param sqft Area per item
   * @param quantity Number of items
   * @returns Total area
   */
  static calculateTotalArea(sqft: number, quantity: number): number {
    return sqft * (quantity || 0);
  }

  /**
   * Calculates the line total based on total area and rate per sqft.
   * @param totalArea Total square footage
   * @param rate Price per square foot
   * @returns Line total
   */
  static calculateLineTotal(totalArea: number, rate: number): number {
    return totalArea * (rate || 0);
  }

  /**
   * Complete calculation pipeline from dimensions to final price.
   */
  static calculateFull(width: number, height: number, quantity: number, rate: number) {
    const sqft = this.calculateSqFt(width, height);
    const totalArea = this.calculateTotalArea(sqft, quantity);
    const lineTotal = this.calculateLineTotal(totalArea, rate);
    
    return {
      sqft,
      totalArea,
      lineTotal
    };
  }
}
