import os
import zipfile

def zip_project(output_filename):
    """
    Zips the entire project directory, excluding certain files and directories.
    """
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Exclude directories
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.git' in dirs:
                dirs.remove('.git')
            
            # Exclude files
            if output_filename in files:
                files.remove(output_filename)
            if 'create_zip.py' in files:
                files.remove('create_zip.py')

            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.relpath(file_path, '.'))

if __name__ == '__main__':
    zip_project('application.zip')
