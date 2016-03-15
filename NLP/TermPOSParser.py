__author__ = 'benjamin ahlbrand'

from NLP.TermFold import TermFold
from NLP import NLPManager as nlp
from Utils.FileFunc import FileFunc

categories = ['C01', 'C02', 'C03', 'C04', 'C05', 'C05', 'C06', 'C07', 'C08', 'O01', 'O02', 'O03', 'O04', 'T01', 'T02',
              'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11']


class TermPOSParser(object):
    def __init__(self, filename=None, threshold=0.0):
        self.table = {}
        self.threshold = threshold
        self._build_table(filename)

    def _check_term(self, term):
        if term in self.table.keys():
            return True

        return False

    def _add_term(self, term):
        if not self._check_term(term):
            forms = self._gen_forms(term)
            entry = {'term': term, 'forms': forms}
            self.table[term] = entry

    def _gen_forms(self, term):
        return nlp.getInstance().gen_forms(term, self.threshold)

    def _build_table(self, filename):
        if filename is None:
            raise ValueError("no filename specified")

        for category in categories:
            print('Processing category: ', category)
            termfold = TermFold(filename, category, 3)

            for group in termfold.build_topics():
                for term in group:
                    self._add_term(term)

            FileFunc.write_json_to_file('../Data/POSTableData/' + category + '.json', self.table)
            self.table = {}

if __name__ == '__main__':

    postab = TermPOSParser('../Data/EMTerms-POS.csv', .1)
