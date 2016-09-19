import os
import csv, json
from random import shuffle

def genProfile(type):

    png_files = [png for png in os.listdir("us1img//"+type)]
    print(png_files)

    arr = []
    for file in png_files:

        entry = []
        entry.append("images/"+type+"/"+file)

        tokens = file.split("_")
        taskType = int(tokens[2])

        question = ""
        options = []

        if taskType == 1:

            question = "In the below image, between the two clusters, are they at the same level?" \
                       " If not, which one is at a higher level?"
            options = ["A",
                       "B",
                       "They are at the same level."]

        else:

            question = "In the below image, among X, Y and Z, which cluster contains T?"
            options = ["X", "Y", "Z", "None of them contains T"]

        entry.append(question)
        entry.append(options)

        arr.append(entry)

    # with open('config.json', 'w') as outfile:
    #     json.dump(arr, outfile, indent=4)
    return arr

def genProfileWrapper():
    return
    # rst = genProfile("EASY") + genProfile("MID") + genProfile("HARD")
    #
    # shuffle(rst)
    # shuffle(rst)
    # shuffle(rst)
    # shuffle(rst)
    # shuffle(rst)
    # shuffle(rst)
    # shuffle(rst)
    #
    # print([ele[0] for ele in rst])

    # with open('configus1.json', 'w') as outfile:
    #     json.dump(rst, outfile, indent=4)

def getCorrectness(user, userId):

    correctAnswer = []
    visType = []
    taskType = []

    # this file should not be changed, as it is the result of a random shuffle
    files = ['images/EASY/01_nul_1_s.JPG', 'images/MID/11_div_2_z.JPG', 'images/MID/02_seq_1_s.JPG', 'images/HARD/16_nul_2_z.JPG',
             'images/HARD/02_nul_1_b.JPG', 'images/EASY/07_qua_1_b.JPG', 'images/HARD/06_seq_1_s.JPG', 'images/HARD/10_qua_2_n.JPG',
             'images/MID/04_qua_1_b.JPG', 'images/EASY/10_seq_2_n.JPG', 'images/EASY/05_nul_1_s.JPG', 'images/EASY/03_qua_1_s.JPG',
             'images/EASY/14_div_2_n.JPG', 'images/EASY/04_seq_1_a.JPG', 'images/HARD/08_div_1_s.JPG', 'images/HARD/03_div_1_s.JPG',
             'images/EASY/11_nul_2_y.JPG', 'images/HARD/15_div_2_z.JPG', 'images/MID/08_nul_1_s.JPG', 'images/HARD/14_qua_2_n.JPG',
             'images/EASY/12_div_2_n.JPG', 'images/HARD/07_qua_1_a.JPG', 'images/MID/15_div_2_y.JPG', 'images/MID/14_nul_2_n.JPG',
             'images/EASY/16_seq_2_y.JPG', 'images/HARD/11_seq_2_n.JPG', 'images/MID/16_qua_2_n.JPG', 'images/MID/06_seq_1_s.JPG',
             'images/MID/05_qua_1_a.JPG', 'images/MID/13_nul_2_x.JPG', 'images/HARD/05_nul_1_s.JPG', 'images/EASY/15_qua_2_n.JPG',
             'images/MID/01_nul_1_s.JPG', 'images/MID/12_seq_2_y.JPG', 'images/MID/10_qua_2_n.JPG', 'images/HARD/13_seq_2_n.jpg',
             'images/HARD/09_nul_2_z.JPG', 'images/HARD/12_div_2_y.JPG', 'images/HARD/01_seq_1_s.JPG', 'images/MID/03_div_1_s.JPG',
             'images/EASY/13_nul_2_y.JPG', 'images/MID/09_seq_2_x.JPG', 'images/EASY/06_seq_1_b.JPG', 'images/EASY/08_div_1_s.JPG',
             'images/EASY/09_qua_2_x.JPG', 'images/MID/07_div_1_a.JPG', 'images/EASY/02_div_1_a.JPG', 'images/HARD/04_qua_1_a.JPG']

    # files = [png for png in os.listdir("us1img//EASY")] + [png for png in os.listdir("us1img//MID")] + [png for png in os.listdir("us1img//HARD")]

    for file in files:

        file = file.replace('.JPG', '').replace('.jpg', '')

        tokens = file.split("_")

        if 'nul' in file:
            visType.append(0)
        elif 'seq' in file:
            visType.append(1)
        elif 'div' in file:
            visType.append(2)
        elif 'qua' in file:
            visType.append(3)
        else:
            print("error")

        if int(tokens[2]) == 1:
            taskType.append(1)

            if tokens[3] == 'a':
                correctAnswer.append(0)
            elif tokens[3] == 'b':
                correctAnswer.append(1)
            elif tokens[3] == 's':
                correctAnswer.append(2)
            else:
                print("error")

        elif int(tokens[2]) == 2:
            taskType.append(2)

            if tokens[3] == 'x':
                correctAnswer.append(0)
            elif tokens[3] == 'y':
                correctAnswer.append(1)
            elif tokens[3] == 'z':
                correctAnswer.append(2)
            elif tokens[3] == 'n':
                correctAnswer.append(3)
            else:
                print("error")

        else:
            print("error")

    print("correct:", correctAnswer)

    with open(user) as data_file:
        profile = json.load(data_file)
    userAnswer = profile['answers']
    userTime = profile['time']
    print("user:", userAnswer)

    print("vis type:", visType)
    print("task type:", taskType)

    correctness = [[], [], [], []]
    timeSpan = [[],[],[],[]]
    taskTypeHere = [[],[],[],[]]

    csvOutput = []

    visName = { 0:'nul', 1:'seq', 2:'div', 3:'qua' }

    for idx, ans in enumerate(userAnswer):
        t = 1 if int(ans) == (correctAnswer[idx]) else 0
        correctness[visType[idx]].append(t)
        timeSpan[visType[idx]].append(userTime[idx])
        taskTypeHere[visType[idx]].append(taskType[idx])
        csvOutput.append(['id'+str(userId if userId >= 10 else '0'+str(userId)), visName[visType[idx]], userTime[idx], taskType[idx]])

    print(correctness[0], timeSpan[0], avg(timeSpan[0], taskTypeHere[0]))
    print(taskTypeHere[0])
    print(correctness[1], timeSpan[1], avg(timeSpan[1], taskTypeHere[1]))
    print(taskTypeHere[1])
    print(correctness[2], timeSpan[2], avg(timeSpan[2], taskTypeHere[2]))
    print(taskTypeHere[2])
    print(correctness[3], timeSpan[3], avg(timeSpan[3], taskTypeHere[3]))
    print(taskTypeHere[3])
    print()

    return csvOutput

import csv

def getCorrectnessWrapper():

    dir = "us1answer//"
    csvOutput = []

    files = [file for file in os.listdir(dir)]
    for idx, file in enumerate(files):
        if '.json' in file:
            print(file)
            csvOutput += getCorrectness(dir+file, idx)

    fout = open('us1data.csv', 'w')
    writer = csv.writer(fout, lineterminator='\n', quotechar='\"',)
    writer.writerow(['subject', 'vis', 'time', 'task'])

    for val in csvOutput:
        writer.writerow(val)

    fout.close()


def avg(l):
    return sum(l) / len(l)

def avg(l, mask):

    # l = l[2:]
    # mask = mask[2:]

    arr1 = []
    arr2 = []
    for idx, val in enumerate(l):
        if mask[idx] == 1:
            arr1.append(val)
        elif mask[idx] == 2:
            arr2.append(val)

    return [sum(arr1) / len(arr1), sum(arr2) / len(arr2)]


if __name__ == '__main__':

    # genProfileWrapper()
    getCorrectnessWrapper()

