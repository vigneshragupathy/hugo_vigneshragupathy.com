#!/usr/bin/env python3
"""
Script to convert markdown links with {:target="_blank"} to Hugo newtabref shortcode format.

Converts:
From: [SSL](https://letsencrypt.org/){:target="_blank"}
To: {{< newtabref  href="https://letsencrypt.org/" title="SSL" >}}
"""

import re
import os
import sys
import argparse
from pathlib import Path


def convert_links_to_shortcode(content):
    """
    Convert markdown links with {:target="_blank"} to Hugo newtabref shortcode.
    
    Args:
        content (str): The content to process
        
    Returns:
        str: Content with converted links
    """
    # Pattern to match [title](url){:target="_blank"}
    pattern = r'\[([^\]]+)\]\(([^)]+)\)\{:target="_blank"\}'
    
    def replace_match(match):
        title = match.group(1)
        url = match.group(2)
        return f'{{{{< newtabref  href="{url}" title="{title}" >}}}}'
    
    # Replace all matches
    converted_content = re.sub(pattern, replace_match, content)
    
    # Count conversions for reporting
    matches = re.findall(pattern, content)
    return converted_content, len(matches)


def process_file(file_path, dry_run=False):
    """
    Process a single file to convert links.
    
    Args:
        file_path (str): Path to the file to process
        dry_run (bool): If True, don't write changes, just show what would be done
        
    Returns:
        int: Number of conversions made
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        converted_content, num_conversions = convert_links_to_shortcode(content)
        
        if num_conversions > 0:
            print(f"{'[DRY RUN] ' if dry_run else ''}Processing {file_path}: {num_conversions} link(s) converted")
            
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(converted_content)
        else:
            print(f"Processing {file_path}: No links to convert")
            
        return num_conversions
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return 0


def find_markdown_files(directory):
    """
    Find all markdown files in a directory recursively.
    
    Args:
        directory (str): Directory to search
        
    Returns:
        list: List of markdown file paths
    """
    markdown_extensions = ['.md', '.markdown', '.mdown', '.mkd']
    markdown_files = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.lower().endswith(ext) for ext in markdown_extensions):
                markdown_files.append(os.path.join(root, file))
    
    return sorted(markdown_files)


def main():
    parser = argparse.ArgumentParser(
        description='Convert markdown links with {:target="_blank"} to Hugo newtabref shortcode'
    )
    parser.add_argument(
        'path',
        help='File or directory to process'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making actual changes'
    )
    parser.add_argument(
        '--recursive',
        action='store_true',
        help='Process all markdown files in directory recursively (if path is a directory)'
    )
    
    args = parser.parse_args()
    
    path = Path(args.path)
    
    if not path.exists():
        print(f"Error: Path '{args.path}' does not exist")
        sys.exit(1)
    
    total_conversions = 0
    
    if path.is_file():
        # Process single file
        total_conversions = process_file(str(path), args.dry_run)
    elif path.is_dir():
        if args.recursive:
            # Process all markdown files in directory recursively
            markdown_files = find_markdown_files(str(path))
            
            if not markdown_files:
                print(f"No markdown files found in {args.path}")
                return
            
            print(f"Found {len(markdown_files)} markdown file(s) to process")
            print("-" * 50)
            
            for file_path in markdown_files:
                conversions = process_file(file_path, args.dry_run)
                total_conversions += conversions
        else:
            print(f"Error: '{args.path}' is a directory. Use --recursive to process all markdown files in it.")
            sys.exit(1)
    
    print("-" * 50)
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Total conversions: {total_conversions}")
    
    if args.dry_run and total_conversions > 0:
        print("\nRun without --dry-run to apply the changes.")


if __name__ == '__main__':
    main()
