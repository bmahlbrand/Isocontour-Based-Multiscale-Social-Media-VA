from NLP import NLPManager as nlp

class SRLTokenNode(dict):
    def __init__(self, token, tag, index):

        token = nlp.getInstance().valid_token(token, tag)

        if token is None:
            return None

        self['token'] = token
        self['tag'] = tag
        self['index'] = index

if __name__ == '__main__':
    node = SRLTokenNode('happy', 'N', 1)
    if node:
        print(node['token'])