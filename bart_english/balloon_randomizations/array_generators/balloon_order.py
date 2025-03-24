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
        print("Block Mean: " + str(calculate_mean(breakpoints)))
        counter += 1
        blockLower += blockSize
        blockUpper += blockSize

blueArrays = generateArray(3, 128, 64, 10)
checkBlocks(blueArrays, 10)

yellowArrays = generateArray(3, 32, 16, 10)
checkBlocks(yellowArrays, 10)

orangeArrays = generateArray(3, 8, 4, 10)
checkBlocks(orangeArrays, 10)

"""Generate colour randomization"""
colours = ['b', 'o', 'y']
colourCount = 10

"""Create the list with each character appearing the specified number of times"""
balloonOrder = colours * colourCount
balloonOrder = shuffle(balloonOrder)
balloonOrder.extend(['b'] * 20)
balloonOrder.extend(['o'] * 20)
balloonOrder.extend(['y'] * 20)
balloonOrder.reverse()
print(balloonOrder)

"""Create dictionary for JSON"""
balloon_dict = {
    "blue": blueArrays,
    "yellow": yellowArrays,
    "orange": orangeArrays,
    "order": balloonOrder
}

"""Export to JSON file"""
with open('balloons.json', 'w') as json_file:
    json.dump(balloon_dict, json_file, indent=4)