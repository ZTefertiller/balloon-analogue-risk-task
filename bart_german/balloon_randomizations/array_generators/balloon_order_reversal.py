import json
import random
import statistics

"""Functions to generate balloon arrays with specific mean inflations, block sizes, etc"""
def shuffle(lst):
    random.shuffle(lst)
    return lst

def inflationcount(lst):
    count = 0
    for num in lst:
        if num == 1:
            break
        count += 1
    return count

def calculate_mean(lst):
    return statistics.mean(lst)

def balloons(lol, breakpoint, avg, size):
    breakpoint += 1
    tolerance = 0.00001  # Define a small tolerance for floating point comparison
    while True:
        lol.clear()
        inflationaverage = []
        for _ in range(size):
            array = list(range(1, breakpoint))
            array = shuffle(array)
            lol.append(array)
            inflationaverage.append(inflationcount(array))
        if abs(calculate_mean(inflationaverage) - avg) < tolerance:
            return lol

def generateArray(multiple, breakpoint, avg, size):
    counter = 0
    fullArray = []
    while counter < multiple:
        array = []
        array = balloons(array, breakpoint, avg, size)
        for x in array:
            fullArray.append(x)
        counter += 1
    return fullArray

"""Sanity check functions"""
def meanCheck(array,start,end):
    breakpoints = []
    for i in range(start,end):
        breakpoints.append(inflationcount(array[i]))
        print(calculate_mean(breakpoints))

def checkBlocks(array, blockSize):
    limit = len(array)/blockSize
    counter = 0
    blockLower = 0
    blockUpper = blockSize
    while counter < limit:
        breakpoints = []
        for i in range(blockLower,blockUpper):
            breakpoints.append(inflationcount(array[i]))
        print("Array Length: " + str(len(array)))
        print("Block " + str(counter) + " Mean: " + str(calculate_mean(breakpoints)))
        counter += 1
        blockLower += blockSize
        blockUpper += blockSize

blueArrays = []
blueProbabilities1 = generateArray(1, 128, 64, 10)
checkBlocks(blueProbabilities1, 10)
blueReversedProbabilities1 = generateArray(1, 8, 4, 10)
checkBlocks(blueReversedProbabilities1, 10)
blueArrays.extend((lambda lst: [x for x in lst])(blueProbabilities1))
blueArrays.extend((lambda lst: [x for x in lst])(blueReversedProbabilities1))
print(blueArrays)
print(len(blueArrays))
checkBlocks(blueArrays, 10)

orangeArrays = generateArray(1, 8, 4, 10)
checkBlocks(orangeArrays, 10)

"""Generate colour randomization"""
# colours = ['b', 'o']
# colourCount = 10
# balloonOrder = colours * colourCount
balloonOrder = []

# balloonOrder = shuffle(balloonOrder)
balloonOrder.extend(['b'] * 10)
balloonOrder.extend(['o'] * 10)
balloonOrder.extend(['b'] * 10)
balloonOrder.extend(['o'] * 10)
balloonOrder.reverse()
print(balloonOrder)

"""Create dictionary for JSON"""
balloon_dict = {
    "blue": blueArrays,
    "orange": orangeArrays,
    "order": balloonOrder
}

"""Export to JSON file"""
# with open('reversalBlueOrange.json', 'w') as json_file:
    # json.dump(balloon_dict, json_file, indent=4)