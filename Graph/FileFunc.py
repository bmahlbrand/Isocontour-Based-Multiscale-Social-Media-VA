import os, errno
import glob


class FileFunc:
    def read_file_into_list(filename):
        with open(filename, 'r') as f:
            data = [line.strip() for line in f]
        return data

    def write_list_into_file_append(filename, list):
        with open(filename, 'a') as f:
            for s in list:
                f.write(s + '\n')

    def write_list_into_file(filename, list):
        with open(filename, 'w') as f:
            for s in list:
                f.write(s + '\n')

    def write_dict_to_file(filename, dict):
        with open(filename, 'w') as f:
            f.write(repr(dict))

    def clear_folder(folderName):
        files = glob.glob(folderName)
        for f in files:
            if f is folderName:
                continue
            try:
                os.remove(f)
            except OSError as e:
                if e.errno != errno.ENOENT:
                    print(e.args[1])
                    raise
