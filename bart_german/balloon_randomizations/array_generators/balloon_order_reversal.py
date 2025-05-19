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
            # Create array starting from 2 to avoid first-inflation pop
            # The 1 (pop value) will be inserted randomly but never at index 0
            array = list(range(2, breakpoint))
            array = shuffle(array)
            
            # Insert the pop value (1) at a position that's not the first inflation
            # This ensures the balloon never pops on first inflation
            if len(array) > 1:  # Make sure there's room to insert
                insert_pos = random.randint(1, len(array))
                array.insert(insert_pos, 1)
            else:
                # If array is too small, add the pop value at the end
                array.append(1)
                
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
def meanCheck(array, start, end):
    breakpoints = []
    for i in range(start, end):
        breakpoints.append(inflationcount(array[i]))
    print(f"Mean inflations: {calculate_mean(breakpoints)}")

def checkBlocks(array, blockSize):
    limit = len(array) // blockSize
    counter = 0
    blockLower = 0
    blockUpper = blockSize
    
    print(f"Total array length: {len(array)}")
    print(f"Number of blocks: {limit}")
    
    while counter < limit:
        breakpoints = []
        for i in range(blockLower, blockUpper):
            breakpoints.append(inflationcount(array[i]))
        
        print(f"Block {counter+1} - Mean: {calculate_mean(breakpoints)}")
        counter += 1
        blockLower += blockSize
        blockUpper += blockSize

# Generate blue arrays with specified parameters
print("Generating blue arrays...")
blueArrays = generateArray(3, 128, 64, 10)
checkBlocks(blueArrays, 10)

blue_reversal = generateArray(3, 8, 4, 10)
checkBlocks(blue_reversal, 10)

blueArrays.extend(blue_reversal)
print("Combined blue arrays:")
checkBlocks(blueArrays, 10)

# Generate yellow arrays
print("\nGenerating yellow arrays...")
yellowArrays = generateArray(6, 32, 16, 10)
checkBlocks(yellowArrays, 10)

# Generate orange arrays
print("\nGenerating orange arrays...")
orangeArrays = generateArray(3, 8, 4, 10)
checkBlocks(orangeArrays, 10)

orange_reversal = generateArray(3, 128, 64, 10)
checkBlocks(orange_reversal, 10)

orangeArrays.extend(orange_reversal)
print("Combined orange arrays:")
checkBlocks(orangeArrays, 10)

"""Generate colour randomization"""
print("\nGenerating balloon color order...")
colours = ['b', 'o', 'y']
colourCount = 10

# Create the list with each character appearing the specified number of times
balloonOrder = colours * colourCount
balloonOrder = shuffle(balloonOrder)

# Add fixed sequences
balloonOrder.extend(['b'] * 20)
balloonOrder.extend(['o'] * 20)
balloonOrder.extend(['y'] * 20)

# Generate another random set
random_set_2 = colours * colourCount
random_set_2 = shuffle(random_set_2)
balloonOrder.extend(random_set_2)

# Add more fixed sequences
balloonOrder.extend(['b'] * 20)
balloonOrder.extend(['o'] * 20)
balloonOrder.extend(['y'] * 20)

# Reverse the order
balloonOrder.reverse()

print(f"Final balloon order length: {len(balloonOrder)}")
print(f"First 20 balloons: {balloonOrder[:20]}")

"""Create dictionary for JSON"""
balloon_dict = {
    "blue": blueArrays,
    "yellow": yellowArrays,
    "orange": orangeArrays,
    "order": balloonOrder
}

"""Export to JSON file"""
with open('180RL_PBLONG_2.json', 'w') as json_file:
    json.dump(balloon_dict, json_file, indent=4)

print("Successfully generated JSON file: 180RL_PBLONG_2.json")