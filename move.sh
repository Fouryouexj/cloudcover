#!/bin/bash

# Function to scan and add directories
scan_directories() {
    declare -gA directories

    # Add home directory and its immediate subdirectories
    directories["home"]="$HOME"
    while IFS= read -r dir; do
        if [ -d "$dir" ]; then
            name=$(basename "$dir" | tr '[:upper:]' '[:lower:]')
            directories["$name"]="$dir"
        fi
    done < <(find "$HOME" -maxdepth 1 -type d ! -name ".*")

    # Add common system directories
    while IFS= read -r dir; do
        if [ -d "$dir" ]; then
            name=$(basename "$dir" | tr '[:upper:]' '[:lower:]')
            directories["$name"]="$dir"
        fi
    done < <(find /usr/local/bin /opt /var /etc -maxdepth 1 -type d 2>/dev/null)
}

# Function to display usage instructions
show_help() {
    echo "Usage: goto [directory_alias]"
    echo "Available aliases:"
    echo "-------------------"
    printf "  %-20s -> %s\n" "${!directories[@]}" "${directories[@]}" | sort
}

# Initialize directories
scan_directories

# Convert input to lowercase for case-insensitive matching
dir_alias=$(echo "$1" | tr '[:upper:]' '[:lower:]')

# Check if argument is provided
if [ -z "$dir_alias" ]; then
    show_help
    return 1
fi

# Check if alias exists in our dictionary (case insensitive)
target_dir=""
for key in "${!directories[@]}"; do
    if [ "$(echo "$key" | tr '[:upper:]' '[:lower:]')" = "$dir_alias" ]; then
        target_dir="${directories[$key]}"
        break
    fi
done

if [ -n "$target_dir" ]; then
    if [ -d "$target_dir" ]; then
        cd "$target_dir" || return 1
        echo -e "\n📂 Moved to: $target_dir"
        echo -e "\nDirectory contents:"
        echo "-------------------"
        ls --color=auto -la
    else
        echo "❌ Error: Directory $target_dir does not exist"
        return 1
    fi
else
    echo "❌ Error: Unknown directory alias '$1'"
    show_help
    return 1
fi