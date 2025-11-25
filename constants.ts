
import { Preset, Category } from './types';

// Core JSON Templates as strings to be interpolated
export const TECHNICAL_TEMPLATE = `{
  "promptDetails": {
    "description": "Ultra-detailed exploded technical infographic of {OBJECT_NAME}, shown in a 3/4 front isometric view. The object is partially transparent and opened, with its key internal and external components separated and floating around the main body in a clean exploded-view layout. Show all major parts typical for this object: outer shell/panels, structural frame, primary electronics/boards, power system/battery or PSU, ports/connectors, display or interface elements if present, input controls/buttons, mechanical modules (motors/gears/fans/hinges) if applicable, speakers/microphones if applicable, cables/flex ribbons, screws/brackets, and EMI/thermal shielding. Use thin white callout leader lines and numbered labels in a minimalist sans-serif font. Background: smooth dark gray studio backdrop. Lighting: soft, even, high-end product render lighting with subtle reflections. Style: photoreal 3D CAD render, industrial design presentation, high contrast, razor-sharp focus, 8K UHD, 100 megapixel, hyper-detailed textures, clean composition, no clutter.",
    "styleTags": [
      "Exploded View",
      "Technical Infographic",
      "Photoreal 3D CAD Render",
      "Industrial Design Presentation",
      "Minimalist Labels",
      "Dark Studio Background"
    ]
  },
  "negativePrompt": "no people, no messy layout, no extra components, no brand logos, no text blur, no cartoon, no low-poly, no watermark, no distorted perspective, no heavy noise, low resolution, blurry",
  "generationHints": {
    "aspectRatio": "{ASPECT_RATIO}", 
    "detailLevel": "{DETAIL_LEVEL}", 
    "stylization": "low-medium",
    "camera": {
      "angle": "3/4 front isometric",
      "lens": "product render perspective"
    },
    "lighting": "soft even studio lighting, subtle reflections",
    "background": "smooth dark gray seamless backdrop"
  }
}`;

export const ORGANIC_TEMPLATE = `{
  "promptDetails": {
    "description": "Ultra-detailed anatomical exploded view and layered biological infographic for {OBJECT_NAME}. The organism is shown from a 3/4 front isometric angle as an educational scientific visual. The outer body is partially transparent and opened; anatomical layers and main systems are separated in a clean exploded layout, hovering around the main body. Clearly show these layers and systems: skin and outer tissue, skeletal system (skull, spine, ribcage, limb bones), muscular system (major muscle groups), circulatory system (heart and main blood vessels), respiratory system (lungs or species-appropriate breathing organs), digestive system (stomach, intestines, liver and related organs), nervous system (brain and main nerve pathways), reproductive system (species-appropriate), plus any special anatomical features of {OBJECT_NAME} such as wings, fins, horns, tail, pouches, etc. Use thin white callout leader lines and numbered labels in a minimalist sans-serif font. Background: smooth dark gray or deep blue scientific studio backdrop. Lighting: soft, even, with clinical clarity suitable for medical illustration. Style: photoreal 3D medical/anatomical render combined with a scientific textbook infographic, high contrast, razor-sharp focus, 8K UHD, 100 megapixel, hyper-detailed textures, clean composition, non-cluttered, education-focused.",
    "styleTags": [
      "Anatomical Exploded View",
      "Biological/Medical Infographic",
      "Layered Anatomy",
      "Photoreal 3D Anatomy Render",
      "Educational Scientific Style",
      "Minimalist Labels",
      "Dark Studio Background"
    ]
  },
  "negativePrompt": "no blood, no gore, no horror, no surgery scene, no overly graphic content, no realistic human portrait face, no messy layout, no extra organs, no blurry text, no cartoon style, no low-poly, no watermark, no distorted perspective, no heavy noise, low resolution, blurry",
  "generationHints": {
    "aspectRatio": "{ASPECT_RATIO}",
    "detailLevel": "{DETAIL_LEVEL}",
    "stylization": "low-medium",
    "camera": {
      "angle": "3/4 front isometric",
      "lens": "scientific anatomy render perspective"
    },
    "lighting": "soft, even, with medical-illustration clarity",
    "background": "smooth dark gray or deep blue seamless studio backdrop"
  }
}`;

export const TECHNICAL_PHOTO_TEMPLATE = `{
  "promptDetails": {
    "description": "Ultra-detailed exploded technical infographic of {OBJECT_NAME}, based on the uploaded reference photo. Match the photo's overall perspective, pose, and proportions as closely as possible, but convert it into a clean 3/4 isometric-like exploded view. The object should be partially transparent and opened, with its key internal and external components separated and floating around the main body in a clean exploded-view layout. Show all major parts typical for this object: outer shell/panels, structural frame, primary electronics/boards, power system/battery or PSU, ports/connectors, display or interface elements if present, input controls/buttons, mechanical modules (motors/gears/fans/hinges) if applicable, speakers/microphones if applicable, cables/flex ribbons, screws/brackets, and EMI/thermal shielding. Use thin white callout leader lines and numbered labels in a minimalist sans-serif font. Background: smooth dark gray studio backdrop (ignore any cluttered or real-world background in the photo). Lighting: soft, even, high-end product render lighting with subtle reflections. Style: photoreal 3D CAD render, industrial design presentation, high contrast, razor-sharp, 8K, clean composition, no clutter.",
    "styleTags": [
      "Exploded View",
      "Technical Infographic",
      "Photoreal 3D CAD Render",
      "Industrial Design Presentation",
      "Minimalist Labels",
      "Dark Studio Background"
    ]
  },
  "negativePrompt": "no people, no messy layout, no extra components, no brand logos, no text blur, no cartoon, no low-poly, no watermark, no distorted perspective, no heavy noise, ignore real-world background, ignore reflections or environment from the original photo",
  "generationHints": {
    "aspectRatio": "{ASPECT_RATIO}",
    "detailLevel": "{DETAIL_LEVEL}",
    "stylization": "low-medium",
    "camera": {
      "angle": "match the reference photo as closely as possible, biased towards a 3/4 front isometric feel",
      "lens": "product render perspective"
    },
    "lighting": "soft even studio lighting, subtle reflections, not the lighting from the original photo",
    "background": "smooth dark gray seamless backdrop",
    "referenceImageMode": "use the uploaded photo of {OBJECT_NAME} as structural and compositional guidance only"
  }
}`;

export const ORGANIC_PHOTO_TEMPLATE = `{
  "promptDetails": {
    "description": "Ultra-detailed anatomical exploded view and layered biological infographic for {OBJECT_NAME}, based on the uploaded reference photo. Match the photo's pose, proportions and overall angle as closely as possible, but convert it into a clean educational exploded view. The outer body should resemble the subject in the photo, but be partially transparent and opened; anatomical layers and main systems are separated in a clean exploded layout, hovering around the main body. Clearly show these layers and systems: skin and outer tissue, skeletal system (skull, spine, ribcage, limb bones), muscular system (major muscle groups), circulatory system (heart and main blood vessels), respiratory system (lungs or species-appropriate breathing organs), digestive system (stomach, intestines, liver and related organs), nervous system (brain and main nerve pathways), reproductive system (species-appropriate), plus any special anatomical features of {OBJECT_NAME} such as wings, fins, horns, tail, pouches, etc. Use thin white callout leader lines and numbered labels in a minimalist sans-serif font. Background: smooth dark gray or deep blue scientific studio backdrop (ignore the original background). Lighting: soft, even, with clinical clarity suitable for medical illustration. Style: photoreal 3D medical/anatomical render combined with a scientific textbook infographic, high contrast, razor-sharp, 8K, clean composition, non-cluttered, education-focused and kid-friendly.",
    "styleTags": [
      "Anatomical Exploded View",
      "Biological/Medical Infographic",
      "Layered Anatomy",
      "Photoreal 3D Anatomy Render",
      "Educational Scientific Style",
      "Minimalist Labels",
      "Dark Studio Background"
    ]
  },
  "negativePrompt": "no blood, no gore, no horror, no surgery scene, no overly graphic or disturbing content, no realistic human portrait face, no messy layout, no extra organs, no blurry text, no cartoon style, no low-poly, no watermark, no distorted perspective, no heavy noise, ignore the original photo background and lighting",
  "generationHints": {
    "aspectRatio": "{ASPECT_RATIO}",
    "detailLevel": "{DETAIL_LEVEL}",
    "stylization": "low-medium",
    "camera": {
      "angle": "match the reference photo's perspective as closely as possible, but in a clean, slightly isometric educational style",
      "lens": "scientific anatomy render perspective"
    },
    "lighting": "soft, even, with medical-illustration clarity, not the lighting from the original photo",
    "background": "smooth dark gray or deep blue seamless studio backdrop",
    "referenceImageMode": "use the uploaded photo of {OBJECT_NAME} as pose and proportion guidance only"
  }
}`;

export const PRESETS: Preset[] = [
  {
    id: 'p1',
    title: 'Sports Car',
    description: 'Complete drivetrain and chassis breakdown',
    category: 'technical',
    params: { objectName: 'Modern Sports Car', aspectRatio: '16:9', detailLevel: 'Ultra', mode: 'text' },
    thumbnail: 'https://picsum.photos/seed/car/400/300'
  },
  {
    id: 'p2',
    title: 'Smartphone',
    description: 'Flagship internals stacked layout',
    category: 'electronics',
    params: { objectName: 'Flagship Smartphone', aspectRatio: '4:3', detailLevel: 'High', mode: 'text' },
    thumbnail: 'https://picsum.photos/seed/phone/400/300'
  },
  {
    id: 'p3',
    title: 'Human Heart',
    description: 'Clinical anatomical view',
    category: 'organic',
    params: { objectName: 'Human Heart', aspectRatio: '1:1', detailLevel: 'Ultra', mode: 'text' },
    thumbnail: 'https://picsum.photos/seed/heart/400/300'
  },
  {
    id: 'p4',
    title: 'Mechanical Watch',
    description: 'Complex gear assembly view',
    category: 'technical',
    params: { objectName: 'Mechanical Watch Movement', aspectRatio: '1:1', detailLevel: 'Ultra', mode: 'text' },
    thumbnail: 'https://picsum.photos/seed/watch/400/300'
  }
];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'technical', label: 'Technical Products' },
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'organic', label: 'Living Organisms' },
];

// --- AI INTELLIGENCE PROMPTS ---

export const PARTS_GENERATION_PROMPT = `
You are an expert technical writer and anatomy educator.
Given a category ({CATEGORY}) and an object name ({OBJECT_NAME}), propose a list of 10-15 key parts that would appear in an exploded view.
For each part, provide:
- id (integer starting from 1)
- name (short technical name)
- system (e.g. skeletal, engine, electronics)
- description (1 short sentence explaining function)

Constraints:
- Neutral, educational tone.
- No gore for organisms.
- Return ONLY JSON array.
`;

export const COACH_SYSTEM_PROMPT = `
You are Inside Coach, an AI assistant for the InsideView AI app.
Role: Help users create the best exploded technical and anatomical visuals.
Context:
- Categories: Technical, Electronics, Organisms.
- Controls: Object Name, Aspect Ratio, Detail Level.
Goals:
1. Suggest improvements to wording or settings.
2. Explain parts if asked.
3. Propose creative ideas (e.g. "For a poster, use 2:3 aspect ratio").
Tone: Professional, concise, helpful. No markdown.
`;

export const VISION_ANALYZER_PROMPT = `
You are the **Vision Analyzer** module of InsideView AI.

Input:
- One photo uploaded by the user.
- Optional short user text describing the image.

Your task:
1. Decide what the main subject of the photo is.
2. Classify the subject into one of these categories:
   - "technical_product"  (cars, machines, engines, tools, vehicles...)
   - "electronics"        (phones, laptops, PCs, consoles, gadgets...)
   - "organism"           (humans, animals, biological creatures, body parts...)
   - "unknown"            (if none fits or the image is too ambiguous).
3. Infer a **canonical name** for the main object or species, suitable to use in a prompt:
   - For cars: brand + model class when possible.
   - For electronics: type and form factor.
   - For organisms: species or description.
4. Estimate the viewpoint / camera angle of the main subject:
   - "3/4 front", "3/4 rear", "front", "rear", "side", "top", "mixed", "unknown"
5. Suggest a **mainRegion** in normalized coordinates (0-1) for the bounding box around the primary subject.
6. Provide a short **summary** (1-2 sentences) describing what the image shows.
7. Provide a numeric **confidence** field between 0 and 1.
8. Set 'sensitive' to true if medical/gore/graphic, else false.

Output STRICTLY as JSON with this structure:
{
  "category": "technical_product" | "electronics" | "organism" | "unknown",
  "canonicalName": "string",
  "viewpoint": "string",
  "mainRegion": { "x": 0.0, "y": 0.0, "width": 1.0, "height": 1.0 },
  "summary": "string",
  "confidence": 0.0,
  "sensitive": boolean
}
`;
