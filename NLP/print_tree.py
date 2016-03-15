class node(object):
    def __init__(self, value, left_children = [], right_children = []):
        self.value = value
        self.left_children = left_children
        self.right_children = right_children

    def __str__(self, level=0):
        ret = "\t"*level+repr(self.value)+"\n"
        left = ""
        right = ""
        for child in self.left_children:
            left += child.__str__(level+1)
        for child in self.right_children:
            right += child.__str__(level+1)
        return left + ret + right

    def __repr__(self):
        return '<tree node representation>'

def init_chid(index, n, parse_tree):
    
    left_childs = parse_tree.find_left_childs(index)
    right_childs = parse_tree.find_right_childs(index)
    
    n.left_children = [ node(parse_tree.tokens[idx]) for idx in left_childs ]
    n.right_children = [ node(parse_tree.tokens[idx]) for idx in right_childs ]
    
    for idx, val in enumerate(left_childs):
        init_chid(val, n.left_children[idx], parse_tree)
    for idx, val in enumerate(right_childs):
        init_chid(val, n.right_children[idx], parse_tree)
    

def print_tree(parse_tree):
    
    trees = []
    for idx in parse_tree.find_all_root():
        
        root = node(parse_tree.tokens[idx])
        init_chid(idx, root, parse_tree)
        trees.append(root)
    
    for tree in trees:
        print(tree)
        print()

if __name__ == '__main__':
    root = node('grandmother')
    root.left_children = [node('son')]
    root.right_children = [node('daughter')]
    root.right_children[0].left_children = [node('random')]
    print(root)