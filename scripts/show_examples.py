#!/usr/bin/env python3
"""
Test script to show specific conversion examples from the file.
"""

import re

def show_conversion_examples(file_path):
    """Show the first few conversion examples."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match [title](url){:target="_blank"}
    pattern = r'\[([^\]]+)\]\(([^)]+)\)\{:target="_blank"\}'
    
    matches = re.findall(pattern, content)
    
    print("Conversion Examples:")
    print("=" * 60)
    
    for i, (title, url) in enumerate(matches[:5], 1):  # Show first 5 examples
        original = f'[{title}]({url}){{:target="_blank"}}'
        converted = f'{{{{< newtabref  href="{url}" title="{title}" >}}}}'
        
        print(f"Example {i}:")
        print(f"  From: {original}")
        print(f"  To:   {converted}")
        print()

if __name__ == '__main__':
    show_conversion_examples("content/posts/2020-06-12-publish-package-in-npm-and-serve-the-static-content-from-cdn.markdown")
