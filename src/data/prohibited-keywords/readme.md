# Prohibited Keywords Database Documentation

This directory contains JSON files with lists of prohibited keywords categorized by type. Each file follows the same structure with a "keywords" array and "lastUpdated" timestamp.

## Categories

### General

- File: `general/general.json`
- Purpose: Contains general prohibited terms related to counterfeit or unauthorized products
- Example keywords: "counterfeit", "fake", "replica", "knockoff"

### Legal

- File: `legal/legal.json`
- Purpose: Contains legally prohibited terms
- Example keywords: "illegal", "stolen", "pirated", "copyrighted"

### Safety

- File: `safety/safety.json`
- Purpose: Contains safety-related prohibited terms
- Example keywords: "hazardous", "toxic", "flammable", "weapon"

### Content

- File: `content/content.json`
- Purpose: Contains prohibited content-related terms
- Example keywords: "offensive", "hate speech", "pornographic", "violent"

## Usage

To use these keyword lists in your application:

1. Import the desired JSON file
2. Access the `keywords` array property
3. Check if user input contains any prohibited keywords

Last updated: March 2024
