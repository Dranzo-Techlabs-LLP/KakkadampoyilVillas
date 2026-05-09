import gdown
import os
import sys

def download_first_n_images(folder_url, output_dir, n=3):
    os.makedirs(output_dir, exist_ok=True)
    # Get the list of files in the folder
    print(f"Fetching folder: {folder_url}")
    try:
        files = gdown.download_folder(folder_url, output=output_dir, quiet=False, use_cookies=False, remaining_ok=True)
        # We might have downloaded all of them if the folder is small, or we can just let gdown download them.
        # Actually gdown.download_folder downloads everything. Let's just run it and terminate if it takes too long, or we can use another method.
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 download_images.py <folder_url> <output_dir>")
        sys.exit(1)
    download_first_n_images(sys.argv[1], sys.argv[2])
