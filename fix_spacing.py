import re

terms_file = r'c:\Users\kawad\OneDrive\Desktop\Recruiter Page\client\public\Terms-and-Conditions-alabty.html'

with open(terms_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all content divs with their top positions
pattern = r'<div class="pdf24_01" style="([^"]*top:([\d.]+)em[^"]*)">'
matches = list(re.finditer(pattern, content))

print(f"Found {len(matches)} content divs")

# Check for large gaps between consecutive divs
gaps = []
for i in range(len(matches) - 1):
    current_top = float(matches[i].group(2))
    next_top = float(matches[i+1].group(2))
    gap = next_top - current_top
    
    if gap > 10:  # Large gap detected
        gaps.append({
            'index': i,
            'current_top': current_top,
            'next_top': next_top,
            'gap': gap
        })

if gaps:
    print(f"\nFound {len(gaps)} large gaps:")
    for g in gaps[:10]:  # Show first 10
        print(f"  Gap of {g['gap']:.2f}em between {g['current_top']:.2f}em and {g['next_top']:.2f}em")
    
    # Fix the gaps by adjusting positions
    print("\nFixing gaps...")
    
    # Build a mapping of old positions to new positions
    position_map = {}
    current_offset = 0
    
    for i, match in enumerate(matches):
        old_top = float(match.group(2))
        
        # Check if this is after a large gap
        if i > 0:
            prev_top = float(matches[i-1].group(2))
            gap = old_top - prev_top
            
            if gap > 10:  # Large gap found
                # Reduce gap to normal spacing (around 1.22em)
                current_offset += (gap - 1.22)
        
        new_top = old_top - current_offset
        position_map[old_top] = new_top
    
    # Apply the fixes
    for old_top, new_top in position_map.items():
        if abs(old_top - new_top) > 0.01:  # Only replace if different
            old_pattern = f'top:{old_top}em'
            new_pattern = f'top:{new_top}em'
            content = content.replace(old_pattern, new_pattern)
    
    # Write back
    with open(terms_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed {len([v for k, v in position_map.items() if abs(k - v) > 0.01])} positioning issues!")
else:
    print("No large gaps found")
