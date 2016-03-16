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

        mapping = []
        for i in range(len(labels)):
            mapping.append([ids[i], labels[i].item()])

        # Number of clusters in labels, ignoring noise if present.
        n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)

        print('# of clusters:', n_clusters_)

        return mapping

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

if __name__ == '__main__':

    sc = SpatialClustering()

    output = []
    with open('multiscale.json') as data_file:
        rst = json.load(data_file)

        for i in range(len(rst)):
            level = rst[i]

            data = []
            ids = []
            for pt in level['pts']:
                data.append([pt[1], pt[2]])
                ids.append(pt[0])

            data = np.array(data)
            cluster = sc.cluster(data, ids)
            output.append({'zoom': level['zoom'], 'cluster': cluster})

    with open('cluster.json', 'w') as outfile:
        json.dump(output, outfile)
