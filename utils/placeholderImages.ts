// Base64 placeholder image as ultimate fallback
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iMzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDE1MFYyMDBIMjAwVjE1MFoiIGZpbGw9IiNEMTcyRTYiLz4KPHBhdGggZD0iTTMwMCAyMDBIMjUwVjI1MEgzMDBWMjAwWiIgZmlsbD0iI0M5QTg3NiIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzUiIHI9IjMwIiBmaWxsPSIjRkEzRjJGIi8+CjxwYXRoIGQ9Ik0yMzAgMTgwSDI3ME0yNTAgMTYwVjIwMCIgc3Ryb2tlPSIjNUM0QjQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4=';

/**
 * Get placeholder image based on property category
 * @param category - Property category
 * @param subCategory - Property subcategory
 * @param subSubCategory - Property sub-subcategory
 * @returns Placeholder image URL (base64 SVG)
 */
export function getPlaceholderImage(
  category: string = '',
  subCategory: string = '',
  subSubCategory: string = ''
): string {
  // For now, return the base64 placeholder
  // This can be extended to return different placeholders based on category
  return PLACEHOLDER_IMAGE;
}
