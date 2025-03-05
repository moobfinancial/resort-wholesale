#!/bin/bash

# Find all .ts and .tsx files
FILES=$(find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*")

# For each file, check if it contains axios imports and replace them with our API instance
for file in $FILES; do
  # Skip our new api.ts file
  if [[ "$file" == "./src/utils/api.ts" ]]; then
    continue
  fi
  
  # Check if the file imports axios
  if grep -q "import axios from 'axios';" "$file" || grep -q 'import axios from "axios";' "$file"; then
    echo "Updating $file"
    
    # Calculate relative path to utils/api.ts
    # Get the directory of the current file
    DIR=$(dirname "$file")
    
    # Calculate the relative path from the current directory to src/utils
    RELATIVE_PATH=$(realpath --relative-to="$DIR" "./src/utils")
    
    # Replace axios import with our API instance using the correct relative path
    sed -i '' "s|import axios from 'axios';|import api from '$RELATIVE_PATH/api';|g" "$file"
    sed -i '' "s|import axios from \"axios\";|import api from \"$RELATIVE_PATH/api\";|g" "$file"
    
    # Replace axios.get with api.get
    sed -i '' 's/axios\.get/api.get/g' "$file"
    
    # Replace axios.post with api.post
    sed -i '' 's/axios\.post/api.post/g' "$file"
    
    # Replace axios.put with api.put
    sed -i '' 's/axios\.put/api.put/g' "$file"
    
    # Replace axios.delete with api.delete
    sed -i '' 's/axios\.delete/api.delete/g' "$file"
    
    # Replace axios.patch with api.patch
    sed -i '' 's/axios\.patch/api.patch/g' "$file"
    
    # Replace axios({ with api({
    sed -i '' 's/axios({/api({/g' "$file"
  fi
done

echo "API calls updated successfully!"
