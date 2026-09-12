// Shared, reusable size charts by garment type — so we're not hand-writing
// a table per product. Products just reference a `garmentType` and this file
// supplies the Men's/Women's table data.

export interface SizeChartRow {
  size: string;
  usSize?: string;
  measurement: string;
  length: string;
}

export interface GarmentSizeChart {
  measurementLabel: string; // e.g. "Chest", "Bust", "Waist"
  mens?: SizeChartRow[];
  womens: SizeChartRow[];
}

export type GarmentType = "tee" | "hoodie" | "sweatpants" | "shorts" | "jersey" | "crop";

export const sizeCharts: Record<GarmentType, GarmentSizeChart> = {
  tee: {
    measurementLabel: "Chest",
    mens: [
      { size: "XS", measurement: "33\"", length: "26\"" },
      { size: "S", measurement: "36\"", length: "27\"" },
      { size: "M", measurement: "39\"", length: "28\"" },
      { size: "L", measurement: "42\"", length: "29\"" },
      { size: "XL", measurement: "45\"", length: "30\"" },
      { size: "XXL", measurement: "48\"", length: "31\"" },
    ],
    womens: [
      { size: "XS", usSize: "0/2", measurement: "32.5\"", length: "24\"" },
      { size: "S", usSize: "4", measurement: "34\"", length: "24.5\"" },
      { size: "M", usSize: "6/8", measurement: "36\"", length: "25\"" },
      { size: "L", usSize: "10/12", measurement: "38\"", length: "25.5\"" },
      { size: "XL", usSize: "14", measurement: "41\"", length: "26\"" },
      { size: "XXL", usSize: "16", measurement: "44\"", length: "26.5\"" },
    ],
  },
  hoodie: {
    measurementLabel: "Chest",
    mens: [
      { size: "XS", measurement: "33\"", length: "26\"" },
      { size: "S", measurement: "36\"", length: "27\"" },
      { size: "M", measurement: "39\"", length: "28\"" },
      { size: "L", measurement: "42\"", length: "29\"" },
      { size: "XL", measurement: "45\"", length: "30\"" },
      { size: "XXL", measurement: "48\"", length: "31\"" },
    ],
    womens: [
      { size: "XS", usSize: "0/2", measurement: "31\"", length: "25\"" },
      { size: "S", usSize: "4", measurement: "33\"", length: "25.5\"" },
      { size: "M", usSize: "6/8", measurement: "35\"", length: "26\"" },
      { size: "L", usSize: "10/12", measurement: "37\"", length: "26.5\"" },
      { size: "XL", usSize: "14", measurement: "40\"", length: "27\"" },
      { size: "XXL", usSize: "16", measurement: "43\"", length: "27.5\"" },
    ],
  },
  sweatpants: {
    measurementLabel: "Waist",
    mens: [
      { size: "XS", measurement: "25-27\"", length: "29\"" },
      { size: "S", measurement: "28-30\"", length: "29.5\"" },
      { size: "M", measurement: "31-33\"", length: "30\"" },
      { size: "L", measurement: "34-36\"", length: "30.5\"" },
      { size: "XL", measurement: "37-39\"", length: "31\"" },
      { size: "XXL", measurement: "40-42\"", length: "31.5\"" },
    ],
    womens: [
      { size: "XS", usSize: "0/2", measurement: "24-25\"", length: "28\"" },
      { size: "S", usSize: "4", measurement: "26-27\"", length: "28.5\"" },
      { size: "M", usSize: "6/8", measurement: "28-29\"", length: "29\"" },
      { size: "L", usSize: "10/12", measurement: "30-32\"", length: "29.5\"" },
      { size: "XL", usSize: "14", measurement: "33-35\"", length: "30\"" },
      { size: "XXL", usSize: "16", measurement: "36-38\"", length: "30.5\"" },
    ],
  },
  shorts: {
    measurementLabel: "Waist",
    mens: [
      { size: "XS", measurement: "27-29\"", length: "5\"" },
      { size: "S", measurement: "30-32\"", length: "5\"" },
      { size: "M", measurement: "33-35\"", length: "6\"" },
      { size: "L", measurement: "36-38\"", length: "6\"" },
      { size: "XL", measurement: "39-41\"", length: "7\"" },
      { size: "XXL", measurement: "42-44\"", length: "7\"" },
    ],
    womens: [
      { size: "XS", usSize: "0/2", measurement: "24-25\"", length: "3\"" },
      { size: "S", usSize: "4", measurement: "26-27\"", length: "3\"" },
      { size: "M", usSize: "6/8", measurement: "28-29\"", length: "3.5\"" },
      { size: "L", usSize: "10/12", measurement: "30-32\"", length: "3.5\"" },
      { size: "XL", usSize: "14", measurement: "33-35\"", length: "4\"" },
    ],
  },
  jersey: {
    measurementLabel: "Chest",
    mens: [
      { size: "XS", measurement: "33\"", length: "26\"" },
      { size: "S", measurement: "36\"", length: "27\"" },
      { size: "M", measurement: "39\"", length: "28\"" },
      { size: "L", measurement: "42\"", length: "29\"" },
      { size: "XL", measurement: "45\"", length: "30\"" },
      { size: "XXL", measurement: "48\"", length: "31\"" },
    ],
    womens: [
      { size: "XS", usSize: "0/2", measurement: "31\"", length: "24\"" },
      { size: "S", usSize: "4", measurement: "33\"", length: "24.5\"" },
      { size: "M", usSize: "6/8", measurement: "35\"", length: "25\"" },
      { size: "L", usSize: "10/12", measurement: "37\"", length: "25.5\"" },
      { size: "XL", usSize: "14", measurement: "40\"", length: "26\"" },
      { size: "XXL", usSize: "16", measurement: "43\"", length: "26.5\"" },
    ],
  },
  // Crop styles are cut as women's fit only — no men's table.
  crop: {
    measurementLabel: "Bust",
    womens: [
      { size: "XS", usSize: "0/2", measurement: "30-31\"", length: "20.5\"" },
      { size: "S", usSize: "4", measurement: "32-34\"", length: "20.87\"" },
      { size: "M", usSize: "6", measurement: "35-37\"", length: "21.26\"" },
      { size: "L", usSize: "08/10", measurement: "38-40\"", length: "21.65\"" },
      { size: "XL", usSize: "12", measurement: "41-43\"", length: "22.05\"" },
    ],
  },
};
