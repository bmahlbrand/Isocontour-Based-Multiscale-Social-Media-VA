import json
import os

import numpy as np

from sklearn.cluster import DBSCAN
from sklearn import metrics
from sklearn.datasets.samples_generator import make_blobs
from sklearn.preprocessing import StandardScaler

os.chdir('E:\Jiawei\Research\Projects\IsoContour_Multiscale_Social_Media_VA')

class SpatialClustering:

    def __init__(self):
        print('init spatial clustering')

    def cluster(self, data, ids):

        # Compute DBSCAN
        db = DBSCAN(eps=3, min_samples=5).fit(data)
        core_samples_mask = np.zeros_like(db.labels_, dtype=bool)
        core_samples_mask[db.core_sample_indices_] = True
        labels = db.labels_

        if len(labels) != len(ids):
            print('fatal error')
            raise

        # Number of clusters in labels, ignoring noise if present.
        numClusters = len(set(labels)) - (1 if -1 in labels else 0)

        print('# of clusters:', numClusters)

        clusters = []
        for i in range(numClusters):
            clusters.append([])

        for i in range(len(labels)):
            if labels[i].item() > -1:
                clusters[labels[i].item()].append(ids[i])

        return clusters

# # Plot result
# import matplotlib.pyplot as plt
#
# # Black removed and is used for noise instead.
# unique_labels = set(labels)
# colors = plt.cm.Spectral(np.linspace(0, 1, len(unique_labels)))
#
# # plt.axis([global_min, global_max, global_min, global_max])
# plt.axis([local_min, local_max, local_min, local_max])
#
# for k, col in zip(unique_labels, colors):
#     if k == -1:
#         # Black used for noise.
#         col = 'k'
#         # do not show noise
#         continue
#
#     class_member_mask = (labels == k)
#
#     xy = X[class_member_mask & core_samples_mask]
#     plt.plot(xy[:, 0], xy[:, 1], 'o', markerfacecolor=col,
#              markeredgecolor='k', markersize=5)
#
#     xy = X[class_member_mask & ~core_samples_mask]
#     plt.plot(xy[:, 0], xy[:, 1], 'o', markerfacecolor=col,
#              markeredgecolor='k', markersize=5)
#
# plt.title('Estimated number of clusters: %d' % n_clusters_)
# plt.show()


# global_max = pow(2, index) * 256
# global_min = 0
#
# local_max = X.max()
# local_min = X.min()

def contains(s,l):
    s = set(s)
    l = set(l)
    return s.issubset(l)

if __name__ == '__main__':

    sc = SpatialClustering()

    output = []
    with open('multiscale.json') as data_file:
        rst = json.load(data_file)

    for i in range(len(rst)):
        level = rst[i]

        print('processing level', level['zoom'])
        data = []
        ids = []
        for pt in level['pts']:
            data.append([pt[1], pt[2]])
            ids.append(pt[0])

        data = np.array(data)
        clusters = sc.cluster(data, ids)

        for i, cluster in enumerate(clusters):
            c = {}
            c['zoom'] = level['zoom']
            c['ids'] = list(set(cluster))
            c['clusterId'] = str(level['zoom']) + "_" + str(i)
            clusters[i] = c

        output = output + clusters
        # output.append({'zoom': level['zoom'], 'cluster': cluster, 'idSet': list(set(ids))})

    # list of clusters;
    with open('cluster_list.json', 'w') as outfile:
        json.dump(output, outfile, indent=True)

    # furthermore, generate the tree structure (dendrogram) for clusters

    # add children field in each node;
    root = {'children': []}
    for i, cluster in enumerate(output):
        cluster['children'] = []
        output[i] = cluster

    zooms = [level['zoom'] for level in rst]
    zooms.sort()

    for zoom in zooms:
        # loop each zoom level, from the abstract(higher) to detailed(lower) level
        currClusters = [cluster for cluster in output if cluster['zoom'] == zoom]
        preClusters = [cluster for cluster in output if cluster['zoom'] == zoom-1]

        if zoom == min(zooms):
            root['children'] = root['children'] + [c['clusterId'] for c in currClusters]
        else:
            # for each cluster, find its parent cluster
            for currCluster in currClusters:
                ids = currCluster['ids']
                clusterId = currCluster['clusterId']

                target = []
                # nested loop for previous level clusters
                for preCluster in preClusters:
                    preIds = preCluster['ids']
                    if contains(ids, preIds):
                        target.append(preCluster)

                if len(target) == 1:
                    target[0]['children'].append(clusterId)
                else:
                    print('fatal error')

    # cluster tree;
    with open('cluster_tree.json', 'w') as outfile:
        json.dump(output, outfile, indent=True)