library(tidyr)
library(ggplot2)

data <- read.csv("/Users/zachtefertiller/Desktop/testalldata.csv")

### producing balloon summary statistics -- blocks are running wild because it isn't doing the first block for all participants
balloonSummary <- function(dataframe, blockSize) {
  
  ### error handling
  required_cols <- c("balloonColors", "balloonInflations", "explosionYesNo", "participantID")
  missing_cols <- setdiff(required_cols, names(dataframe))
  if (length(missing_cols) > 0) {
    stop(paste("Missing columns:", paste(missing_cols, collapse = ", ")))
  }
  
  ### this is a list that will hold the lists of results for each color -- it is a list of lists
  results <- list()
  
  ### grab unique colors
  uniqueColors <- unique(dataframe$balloonColors)
  
  ### looping over all colors of balloons in the csv
  for (color in uniqueColors) {
    colorData <- dataframe[dataframe$balloonColors == color, ]

    ### first we need to summarize the whole of the color unadjusted (all balloons)
    totalMean <- mean(colorData$balloonInflations, na.rm = TRUE)
    totalSD <- sd(colorData$balloonInflations, na.rm = TRUE)
    
    ### then adjusted inflations (only balloons that did not pop)
    adjColorData <- colorData[colorData$explosionYesNo == 0, ]
    totalAdjMean <- mean(adjColorData$balloonInflations, na.rm = TRUE)
    totalAdjSD <- sd(adjColorData$balloonInflations, na.rm = TRUE)
    
    ### define number of blocks for block calculations
    numBlocks <- ceiling(nrow(colorData) / blockSize)
    
    ### list for block statistics
    blockStats <- list()
    
    ### loop over each block
    for (block in 1:numBlocks) {
      # calculate the start and end indices for the current block
      startIdx <- (block - 1) * blockSize + 1
      endIdx <- min(block * blockSize, nrow(colorData))
      
      ### subset the data for the current block
      blockData <- colorData[startIdx:endIdx, ]
      
      ### calculate the mean and SD for the current block
      blockMean <- mean(blockData$balloonInflations, na.rm = TRUE)
      blockSD <- sd(blockData$balloonInflations, na.rm = TRUE)
      
      ### calculate adjusted mean and SD for the current block
      adjBlockData <- blockData[blockData$explosionYesNo == 0, ]
      adjBlockMean <- if(nrow(adjBlockData) > 0) mean(adjBlockData$balloonInflations, na.rm = TRUE) else NA
      adjBlockSD <- if(nrow(adjBlockData) > 0) sd(adjBlockData$balloonInflations, na.rm = TRUE) else NA
      
      blockStats[[paste0("Block", block)]] <- list(
        Mean = blockMean,
        SD = blockSD,
        AdjMean = adjBlockMean,
        AdjSD = adjBlockSD
      )
    }
      ### assign variables to list for each color
      results[[color]] <- c(list(
        TotalMean = totalMean,
        TotalSD = totalSD,
        TotalAdjMean = totalAdjMean,
        TotalAdjSD = totalAdjSD
      ), blockStats = blockStats)
    }
  
  ### finally
  return(results) 
  }

summary <- balloonSummary(data, 10)


### AVERAGE BLOCKS ACROSS PARTICIPANTS IN THE FUNCTION

