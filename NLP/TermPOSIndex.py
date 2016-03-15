__author__ = 'benjamin ahlbrand'
from Utils.FileFunc import FileFunc
import json
import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class TermPOSIndex(object):
    def __init__(self):

        self.table = {}
        self.index = []

        rst = FileFunc.load_files_folder_into_list(BASE_DIR + '\\..\\Data\\POSTableData')
        for filename in rst:
            self._load_terms(filename)

    def _get_term_index(self, term):
        ind = 0
        if term not in self.table.keys():
            return -1

        for t in self.table:
            if term == t:
                break
            ind += 1

        return ind

    def _check_term(self, term):
        if self._get_term_index(term) != -1:
            return True
        else:
            return False

    #convert 'forms' entry of node to their table index
    def _forms_to_indices(self, forms):
        ret = []
        for f in forms:
            ind = self._get_term_index(f)
            if ind != -1:
                ret.append(ind)
            else:
                print(f, 'not found.')

        return ret

    def _add_term(self, node):
        if self._check_term(node['term']) is False:
            for t in node['forms']:
                self.table[node['term']] = [s[0] for s in t['terms']]
            return True
        return False

    def _load_terms(self, filename):

        with open(filename) as f:
            lst = json.load(f)
            # FileFunc.read_file_into_list(filename)

        for l in lst.items():
            self._add_term(l[1])

    def match(self, term1, term2):
        if term1 == term2:
            return True

        if term1 in self.table.keys() and term2 in self.table[term1]:
            return True

        if term2 in self.table.keys() and term1 in self.table[term2]:
            return True

        return False

    def match_group(self, term, group):

        if not group:
            return True

        for entry in group:
            # print(term, entry)
            if self.match(term, entry):
                return True

        return False

    def _check_groups(self, term, groups):
        for g in groups:
            if self.match_group(term, g):
                g.append(term)
                return groups
        return None

    def build_groups(self, terms):
        groups = [[]]

        for term in terms:
            ret = self._check_groups(term, groups)
            # print(ret)
            # for g in groups:
            #     print('?')
            #     if self.match_group(term, g):
            #         g.append(term)
            #         newgrp = True

            if ret is None:
                groups.append([term])

        return groups

if __name__ == '__main__':
    t = TermPOSIndex()
    # print(t.table)
    assert(t.match_group('ham', []))
    assert(t.match_group('ham', ['ham']))
    assert(t.match_group('concern', ['pertinent']))
    assert(t.match('worker', 'proletarian'))

    g = t.build_groups(['adventurer', 'hazard', 'lord', 'shakiness', 'ricketiness', 'precariousness', 'shake', 'wobble',
                        'chief', 'bossy', 'account', 'accountable', 'descriptive', 'burnt', 'burnable', 'combustive',
                        'combustible', 'refuse', 'resistant', 'child', 'childly', 'preparation', 'prepared', 'ready',
                        'youngness', 'immatureness', 'youthfulness', 'young', 'ignitible', 'combustive', 'eruptive',
                        'ignitable', 'combustible'])
    print(g)
