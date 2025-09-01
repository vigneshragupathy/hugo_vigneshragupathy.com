# Link Conversion Script

This script converts markdown links with `{:target="_blank"}` to Hugo's `newtabref` shortcode format.

## What it does

Converts:
```markdown
[SSL](https://letsencrypt.org/){:target="_blank"}
```

To:
```markdown
{{< newtabref  href="https://letsencrypt.org/" title="SSL" >}}
```

## Usage

### Convert a single file

```bash
# Dry run (see what would be changed)
python3 scripts/convert_links_to_shortcode.py --dry-run path/to/file.md

# Apply changes
python3 scripts/convert_links_to_shortcode.py path/to/file.md
```

### Convert all markdown files in a directory

```bash
# Dry run on all markdown files
python3 scripts/convert_links_to_shortcode.py --dry-run --recursive content/

# Apply changes to all markdown files
python3 scripts/convert_links_to_shortcode.py --recursive content/
```

### Show conversion examples

```bash
python3 scripts/show_examples.py
```

## Examples

### Single file conversion
```bash
python3 scripts/convert_links_to_shortcode.py content/posts/my-post.md
```

### Batch conversion with dry run
```bash
python3 scripts/convert_links_to_shortcode.py --dry-run --recursive content/posts/
```

## Script Options

- `--dry-run`: Show what would be changed without making actual changes
- `--recursive`: Process all markdown files in directory recursively (required when processing directories)

## Files

- `convert_links_to_shortcode.py`: Main conversion script
- `show_examples.py`: Shows conversion examples from current file
- `README.md`: This documentation

## Requirements

- Python 3.6+
- No additional dependencies required (uses only standard library)

## Safety

Always use `--dry-run` first to see what changes will be made before applying them to your files.
