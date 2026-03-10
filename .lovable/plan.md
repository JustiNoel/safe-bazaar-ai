

# Integrate Google Cloud Vision API for Enhanced Scan Results

## What This Does

Google Cloud Vision API provides powerful computer vision capabilities: label detection, Safe Search (adult/violence/racy), web detection (find where an image appears online), logo detection, and text extraction (OCR). Adding this to both the **image analysis** and **product scan** flows will give users hard data alongside AI interpretation.

## Integration Points

### 1. Image Analysis (`analyze-image` edge function)
Currently uses only Gemini AI for image forensics. Will add Google Cloud Vision to provide:
- **Web Detection**: Find exact/partial matches across the internet (proves if image is cloned/stolen)
- **Safe Search**: Flag inappropriate content
- **Label Detection**: Identify what's in the image
- **Logo Detection**: Spot brand logos that may indicate counterfeits
- **Text/OCR**: Extract text from product images for cross-referencing

The Vision API results will be passed as context to the AI model, so the final verdict combines hard data with AI reasoning.

### 2. Product Scan (product image uploads)
When users upload a product image during a product scan, send it through Vision API before the risk assessment for richer results.

### 3. UI Updates
Update `ImageAnalysisResult.tsx` to display a new "Vision API Findings" section showing web matches, detected labels, logos, and Safe Search flags.

## Secret Required
- **`GOOGLE_CLOUD_VISION_API_KEY`** — A Google Cloud API key with Vision API enabled. User needs to create it at [Google Cloud Console](https://console.cloud.google.com/apis/credentials) after enabling the Cloud Vision API.

## Technical Plan

| Step | What | File |
|------|------|------|
| 1 | Request `GOOGLE_CLOUD_VISION_API_KEY` secret | Secret tool |
| 2 | Add Vision API call in `analyze-image` edge function | `supabase/functions/analyze-image/index.ts` |
| 3 | Feed Vision results into AI prompt for combined verdict | Same file |
| 4 | Update image analysis result UI with Vision data section | `src/components/ImageAnalysisResult.tsx` |
| 5 | Deploy and test | Edge function deploy + invoke |

### Vision API Call Structure
```typescript
const visionResponse = await fetch(
  `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
  {
    method: "POST",
    body: JSON.stringify({
      requests: [{
        image: { content: base64Data }, // or { source: { imageUri: url } }
        features: [
          { type: "WEB_DETECTION", maxResults: 10 },
          { type: "SAFE_SEARCH_DETECTION" },
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "LOGO_DETECTION", maxResults: 5 },
          { type: "TEXT_DETECTION" }
        ]
      }]
    })
  }
);
```

The web detection results (matching URLs, pages with matching images) are the most valuable for proving whether a seller's product image is stolen from another site.

