import re

terms_file = r'c:\Users\kawad\OneDrive\Desktop\Recruiter Page\client\public\Terms-and-Conditions-alabty.html'

with open(terms_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all content divs with their top positions
pattern = r'<div class="pdf24_01" style="[^"]*top:([\d.]+)em[^"]*">'
matches = list(re.finditer(pattern, content))

print(f"Found {len(matches)} content divs")

# Find the maximum top position
max_top = 0
max_line = None

for match in matches:
    top_value = float(match.group(1))
    if top_value > max_top:
        max_top = top_value
        max_line = match.group(0)

print(f"\nMaximum top position: {max_top}em")
print(f"Last content element: {max_line[:100]}...")

# Calculate appropriate min-height (max_top + some padding for the content height)
recommended_height = max_top + 10  # Add 10em for content height and padding
print(f"\nRecommended min-height: {recommended_height}em")
