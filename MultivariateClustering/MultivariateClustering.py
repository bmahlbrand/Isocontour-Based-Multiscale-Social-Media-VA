import matplotlib.pyplot as plt
import numpy
import scipy.cluster.hierarchy as hcluster
from SampleFile import *
import json

# generate 3 clusters of each around 100 points and an orphan vector
# N=100
# data = numpy.random.randn(3*N,2)
# data[:N] += 5
# data[-N:] += 10
# data[-1:] -= 20

# clustering
thresh = 0.2
clusters = hcluster.fclusterdata(sampleData, thresh, criterion="distance")

clusters = clusters.tolist()
stat = {}
for idx, val in enumerate(clusters):
    if val not in stat:
        stat[val] = []

    stat[val].append(mapping[str(idx)])

newMapping = {};
sizeThres = 10;

for key in stat:
    print(key, len(stat[key]))
    if len(stat[key]) > sizeThres:
        newMapping[key] = len(newMapping)

print(newMapping)

# assign cluster that has less than sizeThres members as outliers, the index is changed to -1 for outliers

output = {}

for idx, val in enumerate(clusters):
    clusterId = mapping[str(idx)]
    if val in newMapping:
        output[clusterId] = newMapping[val]
    else:
        # outlier;
        output[clusterId] = -1

# OUTPUT
with open('boston_cate_cluster.json', 'w') as outfile:
    json.dump(output, outfile, indent=True)