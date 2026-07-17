# Project Rules & Constraints

This file tracks all explicit development, styling, and database seeding rules established for this project. Whenever a new layout is added or updated, ensure full compliance with these constraints.

---

## 📋 Core Rules

### 1. Database & Catalog Seeding
*   **Source Excel Document:** `C:\Users\Sunny\Downloads\Tirumakudalu (3).xlsx`.
*   **Total Listings Limit:** Keep exactly and only the **54 properties** specified in the Excel sheet. No duplicates.
*   **Wiped WordPress Renders:** Ensure old/WordPress demo placeholder assets are wiped. All active assets must match local zip files.

### 2. Media & Local Images
*   **Source Folders:** `Brief Details-20260714T172257Z-1-001.zip` and `Brief Details-20260714T172257Z-1-002.zip`.
*   **Main Hero Image Rule:** Always use front building elevations or architectural renders as the main project image.
*   **No Diagrams as Card Images:** Never use floor plans, master plans, layout drawings, or location maps as the main hero/card image. Filter them out to keep building renderings as primary.
*   **No Placeholders:** If a property has no rendering images in the local folder, keep the main image rendering blank (empty rendering, no static or Unsplash placeholders).

### 3. Price & Area Range Formatting
*   **No Ranges Anywhere:** Never display size ranges (e.g. `1900 to 2500 Sq.ft`) or price ranges (e.g. `₹0.95 Cr - 1.05 Cr`) on the website (including homepage cards and details pages).
*   **Starting Value + Onwards:** If a range or multiple layouts are present, format it by extracting the **minimum starting value** followed by **`Onwards`** (e.g. `1900 Sq.ft Onwards`, `₹0.95 Cr Onwards`).
*   **Plot Dimension Stripping:** Strip plot dimensions (e.g. `30*40` or `30*50`) from area strings before matching size to prevent layout cards from showing plot sizes instead of built-up areas (e.g. showing `2650 Sq.ft Onwards` instead of `30*40 Sq.ft Onwards`).
*   **3-to-5 Digit Area Limit:** Enforce a `\d{3,5}` match length on the area extractor pattern. This prevents matching configuration indicators (like `3 BHK` or `5 series`) as square footage sizes.

### 4. Price-Per-Sqft Multiplication
*   **Compute Starting Crore Price:** If a property lacks a standard price but includes a rate-per-sq.ft value (e.g. `Rs 10,029 per Sq.ft` or `Rs 13,000 per Sq.ft`), automatically multiply it by the minimum starting built-up area to compute the Crore price and display it with `Onwards` (e.g. `₹2.47 Cr Onwards`).
*   **BHK-Stripped Price Matches:** Strip layout indicators (like `3 BHK`) from the pricing strings before running the sq.ft rate match. This prevents matching the `3` in `3 BHK` as the price rate.

### 5. Layout & Text Sanitization
*   **No Raw Configurations Text dumps:** Strip all raw text listing sentences or paragraph tables from descriptions, short taglines, and specifications card fields.
*   **Clean Specification Cards:** The configurations specifications box under *Project Specifications* must render clean layout text summaries (e.g. `1, 2 BHK Apartments` or `4 BHK Villas`) instead of raw Excel price sentences.

### 6. Detail Page Variant Tables
*   **Strict Pre-Validation Match Check:** A variant (e.g. 1 BHK through 5 BHK) must have a matched area size or matched price in the Excel cells to be added to the layout table. This prevents dumping duplicate empty rows in the table.
*   **Overall Price Fallback:** If a specific BHK variant is matched but its price is missing (`On Request`), fall back to displaying the overall starting price of the property so the row is populated with a valid starting price.
*   **Decimal BHK Split Support:** Use a negative lookbehind split pattern (`(?<!\.)\b\d+(?:\.\d+)?\s*(?:bhk|hk|bed|bedroom)`) to prevent decimal configurations (like `3.5 BHK`) from being split into separate layout rows (like `3.` and `5 BHK`).
*   **Servant Quarter (SQ) Suffix Constraint:** Only append `+ SQ` if a standalone `sq` boundary marker or `servant` is matched. Ignore unit suffixes or typos like `sq.ft`, `sqft`, `sft`, `sq.t`.

### 7. Floor Plans Display
*   **Local Asset Resolution:** Mapped layout files in the Floor Plans tab must load correct local assets (pre-pended correctly with `api.getImageUrl`).
*   **Hide Floor Plans Section:** If a property does not have floor plan layouts in its folder, hide the Floor Plans section entirely.

---

## 🛠️ Verification Checklist
*   [x] Verify database contains exactly 33 listings.
*   [x] Verify main images are frontal/building renders, not plans.
*   [x] Verify no price/area ranges are rendered anywhere.
*   [x] Verify rate-per-sqft computes and multiplies automatically.
*   [x] Verify detail pages show clean taglines and specification cards.
*   [x] Verify variant tables list only correct layout rows with fallback prices and no empty rows.
*   [x] Verify floor plans load local paths or hide cleanly.
