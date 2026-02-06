# @genfeedai/prompts

Official prompt templates for Genfeed - the AI-first content creation platform.

## Installation

```bash
npm install @genfeedai/prompts
# or
bun add @genfeedai/prompts
```

## Usage

### Using the Registry

```typescript
import {
  PROMPT_REGISTRY,
  getAllPrompts,
  getPrompt,
  getPromptsByCategory,
  searchPromptsByTag,
  getPromptCategories,
} from '@genfeedai/prompts';

// List all prompts
const prompts = getAllPrompts();

// Get a specific prompt by ID
const prompt = getPrompt('product-photography');
// { id: 'product-photography', title: 'Product Photography', template: '...', ... }

// Get prompts by category
const imagePrompts = getPromptsByCategory('image-generation');
const videoPrompts = getPromptsByCategory('video-generation');
const contentPrompts = getPromptsByCategory('content');

// Search by tag
const marketingPrompts = searchPromptsByTag('marketing');

// List available categories
const categories = getPromptCategories();
```

### Accessing Prompt Files

The actual prompt JSON files are in the `prompts/` directory, organized by category:

```typescript
import productPhoto from '@genfeedai/prompts/prompts/image-generation/product-photography.json';
import blogOutline from '@genfeedai/prompts/prompts/content/blog-outline.json';
```

## Available Prompts

### Image Generation

| ID | Name | Description |
|----|------|-------------|
| `product-photography` | Product Photography | Professional product shots for e-commerce and marketing |
| `social-media-post` | Social Media Post | Eye-catching images optimized for social media engagement |
| `brand-ad` | Brand Advertisement | Professional brand advertisements that convert and engage |
| `portrait-headshot` | Portrait Headshot | Professional headshots for LinkedIn and business use |

### Video Generation

| ID | Name | Description |
|----|------|-------------|
| `product-demo` | Product Demo Video | Engaging product demonstration videos that showcase features |
| `social-clip` | Social Media Clip | Short-form video content optimized for social platforms |
| `ugc-testimonial` | UGC Testimonial | Authentic user-generated content style testimonial videos |

### Content

| ID | Name | Description |
|----|------|-------------|
| `blog-outline` | Blog Post Outline | Comprehensive blog post outlines for content marketing |
| `social-caption` | Social Media Caption | Engaging captions that drive interaction and engagement |
| `email-sequence` | Email Marketing Sequence | Effective email sequences for nurturing and conversion |

## Prompt Schema

Each prompt follows the `PromptTemplate` interface from `@genfeedai/types`:

```typescript
interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'image-generation' | 'video-generation' | 'content';
  tier: 'free' | 'paid' | 'premium';
  template: string;
  variables: PromptVariable[];
  tags: string[];
  exampleOutput?: string;
  icon?: string;
  version: number;
}

interface PromptVariable {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean';
  required?: boolean;
  default?: string | number | boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}
```

## License

AGPL-3.0
