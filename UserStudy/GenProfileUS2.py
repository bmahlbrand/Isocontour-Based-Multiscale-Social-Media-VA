import os
import csv, json

def genProfile(type):

    png_files = [png for png in os.listdir("us2img//"+type)]
    print(png_files)

    arr = []
    for file in png_files:

        entry = []
        entry.append("images/"+type+"/"+file)

        tokens = file.split("_")

        question = ""
        options = []

        if type == "c1":

            numOfCate = tokens[6]
            if int(numOfCate) == 2:
                question = "In the image, between the two categories, which one has a higher value?"
                options = ["<font color='#fb6a4a'><b>Orange</b></font>",
                           "<font color='#2b8cbe'><b>Blue</b></font>",
                           "They have the same value."]
            else:
                question = "In the image, among the four categories, which one has the highest value?"
                options = ["<font color='#1f78b4'><b>Blue</b></font>",
                           "<font color='#e31a1c'><b>Red</b></font>",
                           "<font color='#33a02c'><b>Green</b></font>",
                           "<font color='#ff7f00'><b>Orange</b></font>",
                           "At least two of them have the same highest value"]
        else:

            numOfCate = tokens[7]
            targetCate = int(tokens[3][1])

            string = ""

            if int(numOfCate) == 2 and targetCate == 0:
                string = "<font color='#fb6a4a'><b>Orange</b></font>"
            if int(numOfCate) == 2 and targetCate == 1:
                string = "<font color='#2b8cbe'><b>Blue</b></font>"

            if int(numOfCate) == 4 and targetCate == 0:
                string = "<font color='#1f78b4'><b>Blue</b></font>"
            if int(numOfCate) == 4 and targetCate == 1:
                string = "<font color='#e31a1c'><b>Red</b></font>"
            if int(numOfCate) == 4 and targetCate == 2:
                string = "<font color='#33a02c'><b>Green</b></font>"
            if int(numOfCate) == 4 and targetCate == 3:
                string = "<font color='#ff7f00'><b>Orange</b></font>"

            question = "In the below image, in which cluster is the " + string + " category more prominent"
            options = ["A", "B", "The category has the same proportion in A and B"]

        entry.append(question)
        entry.append(options)


        arr.append(entry)

    # with open('config.json', 'w') as outfile:
    #     json.dump(arr, outfile, indent=4)
    return arr

def genProfileWrapper():
    rst = genProfile("c1") + genProfile("c2")
    with open('configus2.json', 'w') as outfile:
        json.dump(rst, outfile, indent=4)

def getCorrectness(user):

    correctAnswer = []
    type = []
    files = [png for png in os.listdir("us2img//c1")] + [png for png in os.listdir("us2img//c2")]
    for file in files:
        tokens = file.split("_")

        if len(tokens) == 8:
            correctAnswer.append(tokens[3][1])
        else:
            correctAnswer.append('0' if tokens[4] == "A" else '1')

        if 'strip' in file:
            type.append(0)
        elif 'dash' in file:
            type.append(1)
        elif 'stack' in file:
            type.append(2)
        else:
            print("error")

    print(correctAnswer)


    with open(user) as data_file:
        profile = json.load(data_file)
    userAnswer = profile['answers']
    userTime = profile['time']

    print(userAnswer)

    correctness = [[],[],[]]
    timeSpan = [[],[],[]]

    for idx, ans in enumerate(userAnswer):
        t = 1 if ans == correctAnswer[idx] else 0
        correctness[type[idx]].append(t)
        timeSpan[type[idx]].append(userTime[idx])

    # print(correctness[0], timeSpan[0], avg(timeSpan[0]))
    # print(correctness[1], timeSpan[1], avg(timeSpan[1]))
    # print(correctness[2], timeSpan[2], avg(timeSpan[2]))
    print(correctness[0], avg(correctness[0]), timeSpan[0], avg(timeSpan[0]))
    print(correctness[1], avg(correctness[1]), timeSpan[1], avg(timeSpan[1]))
    print(correctness[2], avg(correctness[2]), timeSpan[2], avg(timeSpan[2]))
    print()

def getCorrectnessWrapper():

    dir = "us2answer//"

    files = [file for file in os.listdir(dir)]
    for file in files:
        if '.json' in file:
            print(file)
            getCorrectness(dir+file)



def avg(l):
    return sum(l) / len(l)

if __name__ == '__main__':

    # genProfileWrapper()
    getCorrectnessWrapper()
